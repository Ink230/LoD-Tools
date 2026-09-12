import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export function safeAssetPath(path: string): string {
  if (!path || /[\\:\0]/.test(path) || path.startsWith('/') || path.split('/').some((p) => p === '..' || p === '.' || !p)) throw new Error(`Unsafe package path: ${path}`);
  return path;
}

export function readPackage(bytes: Uint8Array): { source: string; assets: Map<string, Uint8Array> } {
  let size = 0;
  let count = 0;
  if (bytes.byteLength > 256 * 1024 * 1024) throw new Error('Package exceeds the 256 MB editor limit');
  const files = unzipSync(bytes, {
    filter: (entry) => {
      safeAssetPath(entry.name.replace(/\/$/, ''));
      if (++count > 4096) throw new Error('Package exceeds 4096 entries');
      if (entry.originalSize > (entry.name === 'preset.wmap' ? 16 : 64) * 1024 * 1024) throw new Error(`Package entry is too large: ${entry.name}`);
      size += entry.originalSize;
      if (size > 256 * 1024 * 1024) throw new Error('Package exceeds the 256 MB editor limit');
      return !entry.name.endsWith('/');
    },
  });
  const presets = Object.keys(files).filter((name) => name.endsWith('.wmap'));
  if (presets.length !== 1 || presets[0] !== 'preset.wmap') throw new Error('Package must contain exactly one root preset.wmap file');
  const source = strFromU8(files[presets[0]]);
  delete files[presets[0]];
  return { source, assets: new Map(Object.entries(files)) };
}

export function writePackage(source: string, assets: Map<string, Uint8Array>): Uint8Array {
  if (assets.size + 1 > 4096) throw new Error('Package exceeds 4096 entries');
  const files: Record<string, Uint8Array> = { 'preset.wmap': strToU8(source) };
  let total = files['preset.wmap'].byteLength;
  if (total > 16 * 1024 * 1024) throw new Error('Preset XML exceeds 16 MB');
  for (const [path, data] of assets) {
    const safe = safeAssetPath(path);
    if (safe.endsWith('.wmap')) throw new Error('Asset names cannot use the .wmap extension');
    if (data.byteLength > 64 * 1024 * 1024) throw new Error(`Asset exceeds 64 MB: ${safe}`);
    total += data.byteLength;
    if (total > 256 * 1024 * 1024) throw new Error('Package exceeds the 256 MB editor limit');
    files[safe] = data;
  }
  return zipSync(files, { level: 6 });
}
