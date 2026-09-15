// Source-grounded runtime integration check. No payloads leave the local SC files folder.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
const root = process.argv[2];
if (!root) throw new Error('Pass the SC files directory');
const bundle = await build({ stdin: { contents: "export * from './src/app/components/asset-viewer/asset-effect-runtime'; export * from './src/app/components/asset-viewer/asset-effect-context'; export * from './src/app/components/asset-viewer/asset-effect-scene';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { EffectPreviewRuntime, buildEffectScene, effectSetupContext } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const { assets } = JSON.parse(gunzipSync(await readFile('src/assets/asset-viewer/catalog.json.gz')));
const selected = assets.find(asset => asset.path === 'SECT/DRGN0.BIN/5312/0/0');
const metadata = selected?.effectRuntime;
if (!metadata) throw new Error('Selebus effect runtime metadata is missing');
const read = async path => new Uint8Array(await readFile(resolve(root, path)));
const script = await read(metadata.script);
if (createHash('sha256').update(script).digest('hex') !== metadata.program.sha256) throw new Error('Script metadata is stale');
const result = new EffectPreviewRuntime(script, metadata.program, metadata.program.starts[metadata.flags][0], 1).run();
const repeated = new EffectPreviewRuntime(script, metadata.program, metadata.program.starts[metadata.flags][0], 1).run();
if (JSON.stringify(result) !== JSON.stringify(repeated)) throw new Error('Replay is not deterministic');
const scene = await buildEffectScene(result, metadata, read);
if (scene.warnings.length || scene.model.parts.length !== 3 || result.frames.length !== 62) throw new Error(JSON.stringify({ notes: scene.warnings, parts: scene.model.parts.length, ticks: result.frames.length }));
if (!result.frames.at(-1).effects.length && result.frames[2].effects[0].colour[0] > result.frames[1].effects[0].colour[0]) console.log('PASS: 62 ticks, 3 parts, seeded binding, child script, colour fade, wait and deallocation');
else throw new Error('Effect lifetime/colour execution failed');

// Gravity Grabber's selected LMB phase: actual setup, attachment clock and lifetime.
const gravity = assets.find(asset => asset.path === 'SECT/DRGN0.BIN/4414/0/0').effectRuntime;
const gravityScript = await read(gravity.script);
if (createHash('sha256').update(gravityScript).digest('hex') !== gravity.program.sha256) throw new Error('Gravity metadata stale');
for (const side of ['player', 'enemy']) {
  const start = gravity.program.starts[gravity.flags][0];
  const context = effectSetupContext(gravity, start, side);
  if (!context) throw new Error('Gravity setup context missing');
  const result = new EffectPreviewRuntime(gravityScript, gravity.program, start, 1, context).run();
  const scene = await buildEffectScene(result, gravity, read);
  if (scene.warnings.length || scene.model.parts.length !== 54 || result.frames.length !== 15) throw new Error(JSON.stringify({ warnings: scene.warnings, parts: scene.model.parts.length, ticks: result.frames.length }));
  const initial = result.frames[0].effects[0];
  if (initial.position[0] !== (side === 'player' ? -3840 : 2560) || initial.scale[0] !== 0xa20 / 4096 || initial.age !== 1 || initial.translucency !== 2) throw new Error('Incorrect Gravity initial state');
  if (result.frames[1].effects[0].age !== 3 || result.frames.at(-1).effects.length) throw new Error('Incorrect Gravity clock/lifetime');
  if (JSON.stringify(scene.animation.frames[0]) === JSON.stringify(scene.animation.frames[10])) throw new Error('Gravity transforms are frozen');
  for (const frame of scene.animation.frames) for (const part of frame)
    if (![...part.translation, ...part.rotation, ...part.scale].every(Number.isFinite)) throw new Error('Non-finite Gravity transform');
  console.log(`PASS: Gravity Grabber ${side}: 54 parts, 15 ticks, script position/scale/blending, double-speed clock and deallocation`);
}
// Whole Gravity Grabber: do not accept an isolated shard phase as the spell.
for (const side of ['player', 'enemy']) {
  const start = gravity.program.starts[gravity.flags][0];
  const context = effectSetupContext(gravity, start, side, 'spell');
  const run = new EffectPreviewRuntime(gravityScript, gravity.program, start, 1, context).run();
  const replay = new EffectPreviewRuntime(gravityScript, gravity.program, start, 1, context).run();
  if (JSON.stringify(run) !== JSON.stringify(replay)) throw new Error('Spell replay changed with the same seed');
  const scene = await buildEffectScene(run, gravity, read);
  if (scene.warnings.length || run.frames.length !== 220 || run.frames.at(-1).effects.length) throw new Error(JSON.stringify({ notes: scene.warnings, ticks: run.frames.length }));
  for (const path of ['4414/0/2', '4414/0/5', '4414/0/7', '4414/0/0', '4414/0/1', '4114/2/17', '4114/2/34'])
    if (!scene.resources.some(resource => resource.path.endsWith(path))) throw new Error(`Spell resource missing: ${path}`);
  if (!run.frames.some(frame => frame.effects.some(effect => effect.kind === 'Animated'))) throw new Error('Missing animated model body');
  if (!run.frames.some(frame => frame.effects.some(effect => effect.trail))) throw new Error('Missing attached trails');
  if (!run.frames.some(frame => frame.effects.some(effect => effect.particles?.instances.some(p => p.visible)))) throw new Error('Missing live particles');
  if (!run.frames[40].camera || !run.frames.some(frame => frame.flash?.some(value => value > 0))) throw new Error('Missing camera or flash sequence');
  for (const frame of scene.animation.frames) for (const part of frame)
    if (![...part.translation, ...part.rotation, ...part.scale].every(Number.isFinite)) throw new Error('Non-finite spell transform');
  console.log(`PASS: Gravity Grabber ${side} spell: 220 ticks, animated body, both LMBs, pillars, trails, particles, camera, flash and cleanup`);
}