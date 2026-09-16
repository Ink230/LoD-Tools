// Read-only integration check against an extracted SC files directory.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = process.argv[2];
if (!root) throw new Error('Pass extracted SC files directory');
const result = await build({ stdin: { contents: ['asset-model', 'asset-image', 'asset-animation', 'asset-battle-stage'].map(name => `export * from './src/app/components/asset-viewer/${name}';`).join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const decoder = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { assets } = JSON.parse(gunzipSync(await readFile('src/assets/asset-viewer/catalog.json.gz')));
const stages = assets.filter(asset => asset.battleStageId !== undefined && asset.format === 'TMD' && !asset.offset);
const failures = [];
let backdrops = 0;
let animations = 0;
for (const stage of stages) {
  try {
    const model = decoder.decodeModel(await readFile(resolve(root, stage.path)));
    const textures = await Promise.all(stage.textures.map(path => readFile(resolve(root, path))));
    const pages = new Map();
    for (const primitive of model.parts.flatMap(part => part.primitives)) {
      if (!primitive.uvs) continue;
      const key = `${primitive.clut}:${primitive.tpage}`;
      if (!pages.has(key)) pages.set(key, decoder.texturePageFromTims(textures, primitive.clut, primitive.tpage));
      if (!decoder.textureCoversPrimitive(pages.get(key).coverage, primitive.uvs)) throw new Error(`Uncovered texture mapping ${key}`);
    }
    const animation = assets.find(asset => asset.format === 'Animation' && asset.model === stage.path && !asset.offset);
    if (animation) {
      const decoded = decoder.decodeAnimation(await readFile(resolve(root, animation.path)));
      if (decoded.frames[0]?.length !== model.parts.length) throw new Error('Animation/model part count mismatch');
      animations++;
    }
    if (stage.backdrop) {
      decoder.decodeBattleBackdrop(await readFile(resolve(root, stage.backdrop)));
      backdrops++;
    }
  } catch (error) { failures.push({ stage: stage.battleStageId, path: stage.path, error: error.message }); }
}
console.log(JSON.stringify({ stages: stages.length, animations, backdrops, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
