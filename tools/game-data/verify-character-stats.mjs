import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

if (!process.argv[2]) throw new Error('Pass the SC source checkout');
const sourceRoot = resolve(process.argv[2], 'src/main/java/legend/lodmod/characters');
const text = readFileSync('src/app/services/game-data.service.ts', 'utf8');
const enums = new Proxy({}, { get: (_, key) => key });
const literal = text.slice(text.indexOf('[', text.indexOf('public characterData')), text.indexOf('public characterOptions')).trim().replace(/;$/, '');
const characters = runInNewContext(`(${literal})`, { Element: enums, Species: enums });
const retail = readFileSync(resolve(sourceRoot, 'RetailCharacterTemplate.java'), 'utf8');
let checks = 0;

function method(source, name) {
  const match = source.match(new RegExp(`(?:public|protected) int ${name}\\([^)]*\\)\\s*\\{`));
  if (!match) {
    if (source === retail) throw new Error(`SC method not found: ${name}`);
    return method(retail, name);
  }
  const start = match.index + match[0].length;
  let depth = 1, end = start;
  for (; depth; end++) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
  }
  const body = source.slice(start, end - 1).replace(/\bfinal int\b/g, 'const').replace(/\bint\b/g, 'let');
  const arrays = Object.fromEntries([...source.matchAll(/int\[\]\s+(\w+)\s*=\s*\{([^}]+)\}/g)].map(match => [match[1], match[2].replace(/\/\/[^\n]*/g, '').split(',').filter(value => value.trim()).map(Number)]));
  return level => runInNewContext(`(() => { ${body} })()`, { level, dlevel: level, ...arrays });
}

function check(actual, expected, context) {
  checks++;
  if (actual !== expected) throw new Error(`${context}: stored ${actual}, SC ${expected}`);
}

for (const character of characters) {
  const name = ({ Albert: 'Lavitz', Miranda: 'Shana' })[character.firstName] || character.firstName;
  const java = readFileSync(resolve(sourceRoot, `${name}Template.java`), 'utf8');
  for (const [field, array] of Object.entries({ attack: 'ATTACK', defense: 'DEFENSE', magicAttack: 'MAGIC_ATTACK', magicDefense: 'MAGIC_DEFENSE' })) {
    const values = java.match(new RegExp(`\\b${array}\\s*=\\s*\\{([^}]+)\\}`))[1].replace(/\/\/[^\n]*/g, '').split(',').filter(value => value.trim()).map(Number);
    for (const row of character.bodyStats.filter(row => row.level > 0)) {
      check(row[field], values.slice(0, row.level).reduce((sum, value) => sum + value, 0), `${character.firstName} level ${row.level} ${field}`);
    }
  }
  for (const [field, name] of Object.entries({ hp: 'getHpToAdd', speed: 'getSpeedToAdd' })) {
    const increment = method(java, name);
    let total = 0;
    for (let level = 1; level <= 60; level++) {
      total += increment(level - 1);
      check(character.bodyStats.find(row => row.level === level)[field], total, `${character.firstName} level ${level} ${field}`);
    }
  }
  for (const [field, name] of Object.entries({ attack: 'getDragoonAttackToAdd', defense: 'getDragoonDefenseToAdd', magicAttack: 'getDragoonMagicAttackToAdd', magicDefense: 'getDragoonMagicDefenseToAdd' })) {
    const increment = method(java, name);
    let total = 0;
    for (let level = 1; level <= 5; level++) {
      total += increment(level - 1);
      check(character.dragoons[0].dragoonStats[level - 1][field], total, `${character.firstName} D-Level ${level} ${field}`);
    }
  }
}
console.log(`Verified ${checks} character stat values against SC`);
