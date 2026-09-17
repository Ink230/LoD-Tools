"""Generate browser game-data tables from a Severed Chains source checkout.

Usage: python tools/game-data/generate.py D:/java/sc
No game binary payloads are copied. Unsupported source shapes fail generation.
"""
import ast
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SC = Path(sys.argv[1]).resolve()
JAVA = SC / 'src/main/java'
sources = {}


def read(path):
    file = JAVA / path
    text = file.read_text(encoding='utf-8')
    sources[str(file.relative_to(SC)).replace('\\', '/')] = hashlib.sha256(file.read_bytes()).hexdigest()
    return text


def clean(text):
    return re.sub(r'/\*.*?\*/|//[^\n]*', '', text, flags=re.S)


def split(text):
    result, start, depth, quote, escape = [], 0, 0, False, False
    for i, char in enumerate(text):
        if quote:
            if escape:
                escape = False
            elif char == '\\':
                escape = True
            elif char == '"':
                quote = False
        elif char == '"':
            quote = True
        elif char in '([{':
            depth += 1
        elif char in ')]}':
            depth -= 1
        elif char == ',' and depth == 0:
            result.append(text[start:i].strip())
            start = i + 1
    result.append(text[start:].strip())
    return [value for value in result if value]


def balanced(text, start, opening='(', closing=')'):
    depth, quote, escape = 0, False, False
    for i in range(start, len(text)):
        char = text[i]
        if quote:
            if escape:
                escape = False
            elif char == '\\':
                escape = True
            elif char == '"':
                quote = False
        elif char == '"':
            quote = True
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return text[start + 1:i], i + 1
    raise ValueError('Unbalanced Java expression')


def calls(text, name):
    for match in re.finditer(r'\bnew\s+' + re.escape(name) + r'\s*\(', clean(text)):
        body, _ = balanced(clean(text), match.end() - 1)
        yield split(body)


def array(text, name):
    start = text.index('{', text.index(name))
    return split(clean(balanced(text, start, '{', '}')[0]))


def number(value):
    value = value.strip()
    if value in ('true', 'false'):
        return value == 'true'
    try:
        tree = ast.parse(re.sub(r'(?<=\d)[fFL]\b', '', value), mode='eval')
        allowed = (ast.Expression, ast.Constant, ast.UnaryOp, ast.USub, ast.UAdd, ast.BinOp, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.BitOr, ast.BitAnd, ast.LShift, ast.RShift)
        if all(isinstance(node, allowed) for node in ast.walk(tree)):
            return eval(compile(tree, '<numeric Java literal>', 'eval'), {'__builtins__': {}})
    except (ValueError, SyntaxError, TypeError):
        pass
    return value


def title(value):
    return value.replace('_', ' ').strip().title()


lang_path = SC / 'src/main/resources/lod/lang/en.lang'
language = dict(line.split('=', 1) for line in lang_path.read_text(encoding='utf-8').splitlines() if '=' in line and not line.startswith('#'))
sources['src/main/resources/lod/lang/en.lang'] = hashlib.sha256(lang_path.read_bytes()).hexdigest()


def local(kind, ident, suffix='name'):
    return language.get(f'lod.{kind}.{ident}.{suffix}', title(ident) if suffix == 'name' else '').replace('%%', '%').replace('\\n', ' ').strip()


def registry(path):
    text = read(path)
    rows = []
    for match in re.finditer(r'(\w+)\s*=\s*\w+\.register\("([^"]+)"\s*,', text):
        body, _ = balanced(text, text.index('(', match.start()))
        rows.append((match[1], match[2], split(body)[1], f'{path}#L{text[:match.start()].count(chr(10)) + 1}'))
    return rows


def element(expr):
    match = re.search(r'LodMod\.(\w+?)(?:_ELEMENT)?(?:\.get\(\))?$', expr)
    return ('No element' if match[1] == 'NO' else title(match[1])) if match else expr


tables = {}
spell_rows, spell_symbols = [], {}
for symbol, ident, factory, source in registry('legend/lodmod/LodSpells.java'):
    match = re.search(r'new (?:RetailSpell|DragonSpell)\(', factory)
    if not match:
        raise ValueError(f'Unsupported spell: {ident}')
    args = [number(x) for x in split(balanced(factory, match.end() - 1)[0])]
    target, flags, effect, power, multi, accuracy, mp, chance, elem, status, buff, _, index = args[:13]
    multiplier = {1: 8, 2: 6, 4: 5, 8: 4, 16: 3, 32: 2, 64: 1.5, 128: 0.5}.get(power, 1)
    row = dict(id=index, registryId='lod:' + ident, name=local('spells', ident), description=local('spells', ident, 'description'), element=element(elem), mpCost=mp, accuracy=accuracy, target=('All enemies' if target & 8 else 'One enemy') if target & 64 else ('All allies' if target & 8 else 'One ally'), damage=multiplier * 25 if target & 64 and not flags & 128 else None, damageMultiplier=multiplier if target & 64 and not flags & 128 else None, healPercent=multi if effect & 2 else None, statusChance=chance, statusFlags=status, buffFlags=buff, effectFlags=effect, flags=flags, source=source)
    spell_rows.append(row)
    spell_symbols[symbol] = row
tables['spells'] = spell_rows

characters = {}
for name in ['Dart', 'Lavitz', 'Shana', 'Rose', 'Haschel', 'Albert', 'Meru', 'Kongol', 'Miranda']:
    path = f'legend/lodmod/characters/{name}Template.java'
    text = read(path)
    spells = []
    for line in text.splitlines():
        match = re.search(r'character.addSpell\(LodSpells\.(\w+)\.getId\(\)', line)
        if match:
            unlock = re.search(r'SpellDragoonLevelUnlockCriterion\((\d+)\)', line)
            spells.append({**spell_symbols[match[1]], 'unlockLevel': int(unlock[1]) if unlock else 1})
    if not spells:
        raise ValueError(f'No spells for {name}')
    characters[name] = spells
read('legend/lodmod/characters/DartCharacterData.java')
characters['Divine'] = [{**spell_symbols[key], 'unlockLevel': None} for key in ['DIVINE_DG_BALL', 'DIVINE_DG_CANNON']]
playable_spells = {row['registryId'] for spells in characters.values() for row in spells}
for row in spell_rows:
    row['category'] = 'Dragoon spell' if row['registryId'] in playable_spells else 'Internal spell'

monster_source = read('legend/game/combat/Monsters.java')
names = [json.loads(v) for v in array(monster_source, 'monsterNames_80112068')]
stats = list(calls(monster_source, 'MonsterStats1c'))
rewards = list(calls(monster_source, 'EnemyRewards08'))
assert len(stats) == len(rewards) <= len(names), (len(names), len(stats), len(rewards))
enemy_fields = ['hp', 'mp', 'attack', 'magicAttack', 'speed', 'defense', 'magicDefense', 'attackAvoid', 'magicAvoid', 'specialFlags', 'elementFlags', 'elementalImmunityFlags', 'statusResistanceFlags', 'targetX', 'targetY', 'targetZ', 'counterFrameThreshold', 'unknown16', 'unknown17', 'middleX', 'middleY']
elements = {}
for name in ['Water', 'Earth', 'Dark', 'Divine', 'Thunder', 'Light', 'Wind', 'Fire', 'No']:
    text = read(f'legend/game/modding/coremod/elements/{name}Element.java')
    flag = number(re.search(r'super\(([^,]+),', text)[1])
    elements[flag] = 'No element' if name == 'No' else name
tables['enemies'] = []
for index, (name, values, reward) in enumerate(zip(names, stats, rewards)):
    row = dict(zip(enemy_fields, map(number, values)))
    drop = re.search(r'Lod(Items|Equipment)\.(\w+)\.get', reward[3])
    row.update(id=index, name=name.strip() or f'Unused enemy slot {index}', element=elements.get(row['elementFlags'], f"Flags {row['elementFlags']}"), xp=number(reward[0]), gold=number(reward[1]), dropChance=number(reward[2]) if drop else None, drop=local(drop[1].lower(), drop[2].lower()) if drop else None, source='legend/game/combat/Monsters.java')
    row.pop('mp')
    row.pop('unknown16')
    row.pop('unknown17')
    tables['enemies'].append(row)

tables['encounters'] = []
for index, (symbol, ident, factory, source) in enumerate(registry('legend/lodmod/LodEncounters.java')):
    if 'MelbuEncounter::new' in factory:
        text = read('legend/game/combat/encounters/MelbuEncounter.java')
        start = text.index('super(') + 5
        factory = '() -> new PhasedEncounter(' + balanced(text, start)[0] + ')'
    monsters = []
    for args in calls(factory, 'Encounter.Monster'):
        enemy_id = number(args[0])
        assert isinstance(enemy_id, int) and 0 <= enemy_id < len(names)
        monsters.append((enemy_id, args[1]))
    match = re.search(r'new (\w+)\(', factory)
    kind = match[1] if match else factory.split('::')[0]
    args = split(balanced(factory, match.end() - 1)[0]) if match else []
    row = dict(id=index, registryId='lod:' + ident, name=local('encounters', ident), type=kind.removesuffix('Encounter') or 'Standard', enemies=', '.join(f'{names[key]} ×{count}' for key, count in collections.Counter(x[0] for x in monsters).items()), enemyIds=', '.join(str(x[0]) for x in monsters), positions='; '.join(f'{x[0]}: {x[1].replace("new Vector3f", "")}' for x in monsters), source=source)
    if kind in ['Encounter', 'ArenaEncounter', 'PhasedEncounter']:
        offset = 1 if kind == 'PhasedEncounter' else 0
        row.update(musicId=number(args[offset]), escapeChance=number(args[offset + 1]), playerOpeningCamera=number(args[offset + 2]), monsterOpeningCamera=number(args[offset + 3]))
        if offset:
            row['phaseDirectory'] = json.loads(args[0])
    if not monsters:
        row['enemies'] = 'Multi-phase encounter'
    tables['encounters'].append(row)


def constructor_params(text, klass):
    return [(split(m[1]), m.end()) for m in re.finditer(r'public\s+' + klass + r'\((.*?)\)\s*\{', text, re.S)]


def constructor_values(klass, args, depth=0):
    if depth > 12:
        raise ValueError('Constructor cycle')
    candidates = [f'legend/lodmod/items/{klass}.java', f'legend/lodmod/equipment/{klass}.java', f'legend/game/inventory/{klass}.java']
    path = next((p for p in candidates if (JAVA / p).exists()), None)
    if not path:
        return {}
    text = read(path)
    ctor = next(((params, end) for params, end in constructor_params(text, klass) if len(params) == len(args)), None)
    if not ctor:
        raise ValueError(f'No {klass} constructor with {len(args)} arguments')
    params, end = ctor
    values = {p.split()[-1]: number(a) for p, a in zip(params, args)}
    body, _ = balanced(text, end - 1, '{', '}')
    super_call = re.search(r'\b(super|this)\(', body)
    parent = re.search(r'class\s+\w+\s+extends\s+(\w+)', text)
    if super_call and (parent or super_call[1] == 'this'):
        parent_args = split(balanced(body, super_call.end() - 1)[0])
        def substitute(value):
            for key, replacement in values.items():
                value = re.sub(r'\b' + re.escape(key) + r'\b', lambda _: str(replacement).lower() if isinstance(replacement, bool) else str(replacement), value)
            return value
        inherited = constructor_values(klass if super_call[1] == 'this' else parent[1], [substitute(v) for v in parent_args], depth + 1)
        values = {**inherited, **values}
    return values


tables['items'] = []
for category, file_name in [('Item', 'LodItems'), ('Equipment', 'LodEquipment')]:
    for symbol, ident, factory, source in registry(f'legend/lodmod/{file_name}.java'):
        new = re.search(r'new (\w+)\(', factory)
        klass = new[1] if new else factory.split('::')[0]
        args = split(balanced(factory, new.end() - 1)[0]) if new else []
        values = constructor_values(klass, args)
        row = dict(registryId='lod:' + ident, name=local('equipment' if category == 'Equipment' else 'items', ident), description=local('equipment' if category == 'Equipment' else 'items', ident, 'description'), category=category, type=klass, source=source)
        for key, value in values.items():
            if key.startswith('_') or key in ('flags', 'useItemEntrypoint', 'atkLo', 'atkHi'):
                continue
            if key in ('icon', 'slot'):
                value = title(str(value).split('.')[-1])
            elif key == 'element':
                value = element(str(value))
            elif key in ('elementalResistance', 'elementalImmunity'):
                value = ', '.join(element(v) for v in re.findall(r'LodMod\.\w+\.get\(\)', str(value))) or 'None'
            elif key == 'target':
                value = title(str(value).split('.')[-1])
            row[key] = value
        if category == 'Equipment':
            row['attack'] = values.get('atk', values.get('atkHi', 0) + values.get('atkLo', 0))
        tables['items'].append(row)

submaps = read('legend/game/submap/RetailSubmap.java')
cut_rows = list(calls(submaps, 'SubmapEncounterData_04'))
tables['submaps'] = [dict(id=i, name=f'Submap cut {i}', category='Cut', scene=number(a[0]), encounterRate=number(a[1]), stageId=number(a[2]), source='legend/game/submap/RetailSubmap.java') for i, a in enumerate(cut_rows)]
area_names = [json.loads(v) for v in array(read('legend/game/SItem.java'), 'submapNames_8011c108')]
tables['submaps'] += [dict(id=i, name=name, category='Area name', source='legend/game/SItem.java') for i, name in enumerate(area_names) if name]

ambiance = read('legend/game/combat/environment/Ambiance.java')
tables['stages'] = []
for index, args in enumerate(calls(ambiance, 'StageAmbiance4c')):
    folder = SC / f'files/SECT/DRGN0.BIN/{2497 + index}'
    files = {str(p.relative_to(folder)).replace('\\', '/'): p.stat().st_size for p in folder.rglob('*') if p.is_file()} if folder.exists() else {}
    ambient = ', '.join(str(number(v)) for v in split(balanced(args[0], args[0].index('('))[0]))
    row = dict(id=index, name=f'Battle stage {index}', category='Battle stage', ambientColour=ambient, modelBytes=files.get('0/0'), animationBytes=files.get('0/1'), backdropBytes=files.get('1'), textureBytes=files.get('2'), path=f'SECT/DRGN0.BIN/{2497 + index}', source='legend/game/combat/environment/Ambiance.java')
    for light_index, light in enumerate(args[4:], 1):
        values = split(balanced(light, light.index('('))[0])
        for field, value in [('Direction', values[0]), ('Colour', values[3])]:
            row[f'light{light_index}{field}'] = ', '.join(str(number(v)) for v in split(balanced(value, value.index('('))[0]))
    row['submapCuts'] = ', '.join(str(cut['id']) for cut in tables['submaps'] if cut.get('stageId') == index and cut.get('encounterRate', 0) > 0)
    tables['stages'].append(row)

for section, rows in tables.items():
    assert rows, section
    (ROOT / 'src/assets/game-data').mkdir(parents=True, exist_ok=True)
    (ROOT / f'src/assets/game-data/{section}.json').write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

generated = ROOT / 'src/app/services/generated-character-spells.ts'
generated.write_text('''// Generated by tools/game-data/generate.py; do not edit manually.
interface GeneratedCharacterSpell {
  id: number; registryId: string; name: string; description: string; element: string;
  mpCost: number; accuracy: number; target: string; damage: number | null;
  damageMultiplier: number | null; healPercent: number | null; statusChance: number;
  statusFlags: number; buffFlags: number; effectFlags: number; flags: number;
  source: string; unlockLevel: number | null;
}
export const CHARACTER_SPELLS: Record<string, GeneratedCharacterSpell[]> = ''' + json.dumps(characters, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
manifest = dict(sourceRepository='https://github.com/Legend-of-Dragoon-Modding/Severed-Chains', sourceCommit=subprocess.check_output(['git', '-C', str(SC), 'rev-parse', 'HEAD'], text=True).strip(), sources=sources, counts={key: len(value) for key, value in tables.items()})
(ROOT / 'src/assets/game-data/provenance.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest['counts']))
