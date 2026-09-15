// Local integration check; reads extracted resources without copying their payloads.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { build } from 'esbuild';
const root = process.argv[2];
if (!root) throw new Error('Pass the extracted SC files directory');
const result = await build({ stdin: { contents: ['asset-model', 'asset-image', 'asset-animation', 'asset-scene', 'asset-audio'].map(name => `export * from './src/app/components/asset-viewer/${name}';`).join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const decoders = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { assets } = JSON.parse(gunzipSync(await readFile('src/assets/asset-viewer/catalog.json.gz')));
const formats = ['TIM', 'MCQ', 'TMD', 'Animation', 'CMB', 'LMB', 'ANM', 'CLUT', 'SPU', 'Environment', 'Collision'];
let failed = 0;
for (const format of formats) {
  const matches = assets.filter(asset => asset.format === format);
  const selected = matches.filter((_, i) => i % Math.max(1, Math.floor(matches.length / 12)) === 0).slice(0, 12);
  let passed = 0;
  for (const record of selected) {
    try {
      const bytes = (await readFile(resolve(root, record.path))).subarray(record.offset || 0);
      if (format === 'TIM') decoders.decodeTim(bytes);
      if (format === 'MCQ') decoders.decodeMcq(bytes);
      if (format === 'TMD') { const model = decoders.decodeModel(bytes); if (!model.parts.some(part => part.primitives.length)) throw new Error('No renderable primitives'); }
      if (format === 'Animation' || format === 'CMB') decoders.decodeAnimation(bytes);
      if (format === 'LMB') decoders.decodeLmb(bytes, record.lmbType || 0);
      if (format === 'ANM') decoders.decodeAnm(bytes);
      if (format === 'CLUT') decoders.decodeClutAnimationDetails(bytes);
      if (format === 'Environment') decoders.decodeEnvironment(bytes);
      if (format === 'Collision') decoders.decodeCollision(bytes, record.collisionInfo ? await readFile(resolve(root, record.collisionInfo)) : undefined);
      if (format === 'SPU') { const samples = decoders.listSpuSamples(bytes); decoders.decodeSpuSample(bytes, 44100, samples[0]?.offset || 0); }
      passed++;
    } catch (error) { failed++; console.log(`FAIL ${format} ${record.path}@${record.offset || 0}: ${error.message}`); }
  }
  console.log(`${format}: ${passed}/${selected.length}`);
}
process.exitCode = failed ? 1 : 0;
