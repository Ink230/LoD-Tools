// Uses local SC data only; no game payloads are copied into the website.
// Usage: node tools/asset-viewer/verify-overlay-palettes.mjs D:/java/sc/files
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = process.argv[2];
if (!root) throw new Error('Pass the SC files directory');
const bundle = await build({ stdin: { contents: "export * from './src/app/components/asset-viewer/asset-image';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false });
const { decodeAssetTim } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const source = await readFile(resolve(root, '../src/main/java/legend/game/submap/RetailSubmap.java'), 'utf8');
const table = source.match(/smapFileIndices_800f982c\s*=\s*\{([^}]+)\}/s);
if (!table) throw new Error('SC overlay index table not found');
const indices = [...new Set(table[1].match(/\d+/g).map(Number))].filter(Boolean);
let palettes = 0;
for (const index of indices) {
  const path = `SECT/DRGN0.BIN/${index + 1}/0`;
  const bytes = new Uint8Array(await readFile(resolve(root, path)));
  const first = decodeAssetTim(bytes, path);
  for (let palette = 0; palette < first.paletteCount; palette++) {
    const image = decodeAssetTim(bytes, path, palette);
    if (image.width !== 64 || image.height !== 112 || image.paletteCount !== 16) throw new Error(`Palette rows included in preview: ${path}`);
    if (image.pixels.length !== image.width * image.height * 4) throw new Error(`Invalid image: ${path}`);
    // Compare first pixel against the actual embedded BGR555 palette word.
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const colour = view.getUint16(20 + (112 + palette) * 32 + (bytes[20] & 15) * 2, true);
    const expected = colour === 0 ? [0, 0, 0, 0] : [(colour & 31) * 8, ((colour >>> 5) & 31) * 8, ((colour >>> 10) & 31) * 8, colour & 0x8000 ? 128 : 255];
    if (image.pixels.slice(0, 4).some((value, channel) => value !== expected[channel])) throw new Error(`Palette mismatch: ${path} / ${palette}`);
    palettes++;
  }
}
console.log(`PASS: ${indices.length} SC overlay TIMs, ${palettes} palette decodes, checked against embedded BGR555 colours`);
