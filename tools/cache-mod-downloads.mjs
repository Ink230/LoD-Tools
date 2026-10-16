import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const downloads = JSON.parse(await readFile('src/assets/mod-downloads.json', 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// GitHub release assets do not allow browser fetches from another origin.
// Cache the exact pinned assets for static hosting; clients assemble their ZIP.
for (const download of downloads) {
  const directory = resolve('src/assets/mod-downloads', download.id, download.sha256);
  const target = resolve(directory, download.filename);
  let cached;
  try {
    cached = await readFile(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (cached && digest(cached) === download.sha256) continue;

  const response = await fetch(download.url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`${download.id}: release download failed (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (digest(bytes) !== download.sha256) throw new Error(`${download.id}: release checksum changed; review the asset before updating the manifest`);
  await mkdir(directory, { recursive: true });
  await writeFile(target, bytes);
  console.log(`Cached ${download.id}: ${download.filename}`);
}
console.log(`Verified ${downloads.length} pinned mod downloads`);
