import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('dist/lodtools');
const notices = [
  ['LICENSE.txt', await readFile('LICENSE.txt')],
  ['THIRD_PARTY_NOTICES.txt', await readFile('THIRD_PARTY_NOTICES.md')],
  ['3rdpartylicenses.txt', await readFile(resolve(output, '3rdpartylicenses.txt'))],
];

// CodeBuild uploads the base directory; hosts may serve its browser subdirectory.
for (const directory of [output, resolve(output, 'browser')]) {
  for (const [name, content] of notices) {
    await writeFile(resolve(directory, name), content);
  }
}
console.log('Published plain-text project license and third-party notices');
