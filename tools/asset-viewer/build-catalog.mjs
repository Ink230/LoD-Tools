// Generates metadata only. No game payloads are copied into the website.
// Usage: node tools/asset-viewer/build-catalog.mjs D:/java/sc/files [output.json]
import { open, readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { identifyAsset, assetCategory, gameIdentity } from '../../src/app/components/asset-viewer/asset-catalog.ts';

const root = resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Pass the extracted SC files directory');
const output = resolve(process.argv[3] || 'src/assets/asset-viewer/catalog.json.gz');
const files = [];
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || (!prefix && entry.name === 'patches')) continue;
    const path = prefix + entry.name;
    if (entry.isDirectory()) await walk(resolve(directory, entry.name), path + '/');
    else if (entry.isFile() && entry.name !== 'mrg') files.push(path);
  }
}
await walk(root);
const assets = [];
const effectNames = new Map();
try {
  const registrations = await readFile(resolve(root, '../src/main/java/legend/lodmod/LodDeffs.java'), 'utf8');
  for (const match of registrations.matchAll(/register\("([^"]+)",\s*\(\)\s*->\s*new RetailDeffPackage\((\d+)\)/g)) {
    const name = match[1].replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    effectNames.set(Number(match[2]), name); effectNames.set(Number(match[2]) + 1, name);
  }
} catch { /* Physical format browsing remains available without SC's source checkout. */ }
const headers = new Map();
let next = 0;
await Promise.all(Array.from({ length: 16 }, async () => {
  while (next < files.length) {
    const path = files[next++];
    const file = await open(resolve(root, path), 'r');
    try {
      const header = new Uint8Array(256);
      const { bytesRead } = await file.read(header, 0, header.length, 0);
      const bytes = header.subarray(0, bytesRead);
      const format = identifyAsset(bytes, path);
      if (format !== 'Unknown') {
        assets.push({ path, name: path.split('/').at(-1), format, category: assetCategory(format), ...gameIdentity(path), size: (await file.stat()).size });
      }
      if (format === 'Unknown' && bytesRead >= 24) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const type = view.getUint32(0, true) >>> 24;
        const size = (await file.stat()).size;
        const addEmbedded = async (offset, expected, modelOffset, lmbType) => {
          if (offset < 12 || offset > size - 16 || offset % 4) return;
          const payload = new Uint8Array(128);
          const read = await file.read(payload, 0, payload.length, offset);
          const format = identifyAsset(payload.subarray(0, read.bytesRead), path);
          if (!expected.includes(format)) return;
          assets.push({ path, name: `${path.split('/').at(-1)} · ${format}`, format, category: assetCategory(format), ...gameIdentity(path), size, offset, ...(modelOffset ? { model: path, modelOffset } : {}), ...(lmbType !== undefined ? { lmbType } : {}) });
        };
        if (type === 0 && view.getUint32(4, true) <= 2) await addEmbedded(view.getUint32(8, true), ['LMB'], undefined, view.getUint32(4, true));
        if ([1, 2, 3, 5].includes(type)) {
          const modelOffset = view.getUint32(12, true);
          const animationOffset = view.getUint32(20, true);
          if (modelOffset !== animationOffset) await addEmbedded(modelOffset, ['TMD']);
          if (type !== 3) await addEmbedded(animationOffset, ['CMB', 'LMB', 'Animation'], modelOffset !== animationOffset ? modelOffset : undefined, 0);
        }
      }
      if (/\/0$/.test(path) && bytesRead >= 24) headers.set(path, bytes);
    } finally { await file.close(); }
  }
}));
const byPath = new Map(assets.map(asset => [asset.path, asset]));
const allPaths = new Set(files);
const byDirectory = Map.groupBy(assets, asset => asset.path.slice(0, asset.path.lastIndexOf('/')));
for (const asset of assets) {
  const effectId = /^SECT\/DRGN0\.BIN\/(\d+)\//.exec(asset.path);
  if (effectId && effectNames.has(Number(effectId[1]))) { asset.gameCategory = 'abilities'; asset.gameAsset = effectNames.get(Number(effectId[1])); }
  const directory = asset.path.slice(0, asset.path.lastIndexOf('/'));
  const siblings = byDirectory.get(directory) || [];
  const models = siblings.filter(item => item.format === 'TMD');
  let model = models.length === 1 && directory.split('/').length >= 3 ? models[0] : undefined;
  // RetailSubmap packs each object's model + 32 animations in groups of 33.
  const submap = /^SECT\/DRGN2[1-4]\.BIN\/\d+\/(\d+)$/.exec(asset.path);
  if (submap) model = byPath.get(`${directory}/${Math.floor(Number(submap[1]) / 33) * 33}`);
  if (asset.format === 'Animation' && !asset.offset && model?.format === 'TMD' && !asset.model) { asset.model = model.path; asset.modelOffset = model.offset; }
  const character = asset.path.match(/^(characters\/[^/]+)\/models\/(combat|dragoon)\//);
  if (character) asset.textures = [`${character[1]}/textures/${character[2]}`].filter(path => allPaths.has(path));
  else asset.textures = directory.split('/').length >= 3 ? siblings.filter(item => item.format === 'TIM').map(item => item.path) : [];
  if (submap && ['TMD', 'Animation'].includes(asset.format)) {
    const texture = `${directory}/textures/${Math.floor(Number(submap[1]) / 33)}`;
    if (allPaths.has(texture)) asset.textures = [texture];
  }
  if (asset.offset && !asset.textures.length) {
    const parent = directory.slice(0, directory.lastIndexOf('/'));
    if (parent.split('/').length >= 3) asset.textures = (byDirectory.get(parent) || []).filter(item => item.format === 'TIM').map(item => item.path);
  }
  if (asset.format === 'ANM' && asset.path.startsWith('SUBMAP/savepoint/')) asset.textures = ['SUBMAP/big_arrow.tim', 'SUBMAP/small_arrow.tim', 'SUBMAP/savepoint.tim'];
  // RetailSubmap.loadBackground: environment 0, collision info 1, TMD 2, TIMs 3+.
  if (asset.format === 'TMD' && asset.path.endsWith('/2') && /^SECT\/DRGN2[1-4]\.BIN\//.test(asset.path)) {
    const envPath = `${directory}/0`;
    const header = headers.get(envPath);
    if (header && !byPath.has(envPath) && header[20] > 0 && header[20] === header[21] + header[22] && allPaths.has(`${directory}/1`) && siblings.some(item => item.format === 'TIM')) {
      const size = (await stat(resolve(root, envPath))).size;
      if (size >= 24 + header[20] * 36) {
        asset.format = 'Collision'; asset.category = 'scenes'; asset.collisionInfo = `${directory}/1`; asset.environment = envPath;
        assets.push({ path: envPath, name: 'Environment', format: 'Environment', category: 'scenes', ...gameIdentity(envPath), size, collision: asset.path, collisionInfo: asset.collisionInfo, textures: asset.textures });
      }
    }
  }
}
// CContainer's optional CLUT-animation table points to four instruction streams.
for (const model of assets.filter(asset => asset.format === 'TMD')) {
  const file = await open(resolve(root, model.path), 'r');
  try {
    const base = model.offset || 0;
    const header = new Uint8Array(16); await file.read(header, 0, 16, base);
    const view = new DataView(header.buffer);
    const tmdOffset = view.getUint32(0, true), clutOffset = view.getUint32(4, true);
    if (tmdOffset < 12 || tmdOffset === 0x41 || !clutOffset || base + clutOffset + 16 >= model.size) continue;
    const table = new Uint8Array(16); await file.read(table, 0, 16, base + clutOffset);
    const pointers = new DataView(table.buffer);
    for (let i = 0; i < 4; i++) {
      const offset = base + clutOffset + pointers.getUint32(i * 4, true);
      if (offset < base + clutOffset + 16 || offset + 8 > model.size) continue;
      const stream = new Uint8Array(8); await file.read(stream, 0, 8, offset);
      if (new DataView(stream.buffer).getInt16(4, true) === -1) continue;
      assets.push({ ...model, name: `${model.name} · Palette ${i + 1}`, format: 'CLUT', category: 'models', offset, model: model.path, modelOffset: model.offset || 0 });
    }
  } finally { await file.close(); }
}
assets.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }) || (a.offset || 0) - (b.offset || 0));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, gzipSync(JSON.stringify({ version: 1, extractionVersion: (await readFile(resolve(root, 'version'), 'utf8')).trim(), assets }), { level: 9 }));
console.log(JSON.stringify({ scanned: files.length, assets: assets.length, formats: Object.fromEntries([...Map.groupBy(assets, item => item.format)].map(([format, items]) => [format, items.length])) }));
