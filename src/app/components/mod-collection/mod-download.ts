import { unzip, Unzipped, zip } from 'fflate';
import downloads from '../../../assets/mod-downloads.json';
import { ModListing } from './mod-catalog';

export interface ModDownload {
  readonly id: string;
  readonly releaseUrl: string;
  readonly url: string;
  readonly filename: string;
  readonly sha256: string;
  readonly stripPrefix?: string;
}

export const MOD_DOWNLOADS: readonly ModDownload[] = downloads;
const MAX_UNPACKED_BYTES = 512 * 1024 * 1024;

export function modDownload(mod: ModListing, available: readonly ModDownload[] = MOD_DOWNLOADS): ModDownload | undefined {
  const primaryUrl = mod.releases[0]?.url;
  return available.find(download => download.id === mod.id && !!primaryUrl
    && (download.releaseUrl === primaryUrl || download.releaseUrl.startsWith(primaryUrl + '/tag/')));
}

function safePath(path: string): string {
  if (!path || path.startsWith('/') || /[\\:]/.test(path) || path.includes(String.fromCharCode(0)) || path.split('/').some(part => part === '..' || part === '.')) {
    throw new Error(`Unsafe archive path: ${path}`);
  }
  return path;
}

/** Merge files at the mods root, preserving subfolders and JARs as files. */
export function mergeModFiles(target: Unzipped, incoming: Unzipped, stripPrefix = ''): void {
  for (const [original, bytes] of Object.entries(incoming)) {
    safePath(original);
    if (original.endsWith('/')) continue;
    if (stripPrefix && !original.startsWith(stripPrefix)) throw new Error(`Expected ${original} inside ${stripPrefix}`);
    const path = safePath(original.slice(stripPrefix.length));
    const lowerPath = path.toLowerCase();
    const collision = Object.keys(target).find(existing => existing.toLowerCase() === lowerPath);
    if (collision) {
      const previous = target[collision];
      if (previous.length === bytes.length && previous.every((value, index) => value === bytes[index])) continue;
      throw new Error(`Selected mods contain conflicting files: ${path}. Download them separately.`);
    }
    if (Object.keys(target).some(existing => existing.toLowerCase().startsWith(lowerPath + '/') || lowerPath.startsWith(existing.toLowerCase() + '/'))) {
      throw new Error(`Selected mods contain a file/folder conflict: ${path}. Download them separately.`);
    }
    target[path] = bytes;
  }
}

export async function createModBundle(
  mods: readonly ModListing[],
  progress: (message: string) => void,
  signal?: AbortSignal,
  fetchAsset: typeof fetch = fetch,
  available: readonly ModDownload[] = MOD_DOWNLOADS,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!mods.length) throw new Error('Select at least one mod.');
  const files: Unzipped = Object.create(null);
  let unpackedBytes = 0;
  for (const mod of mods) {
    signal?.throwIfAborted();
    const download = modDownload(mod, available);
    if (!download) throw new Error(`${mod.name} has no combined download available.`);
    progress(`Downloading ${mod.name}…`);
    const response = await fetchAsset(`/assets/mod-downloads/${download.id}/${download.sha256}/${encodeURIComponent(download.filename)}`, { signal });
    if (!response.ok) throw new Error(`${mod.name} could not be downloaded (${response.status}). Please try again.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== download.sha256) throw new Error(`${mod.name} download is incomplete or out of date. Please refresh and try again.`);
    progress(`Preparing ${mod.name}…`);
    if (download.filename.endsWith('.jar')) {
      unpackedBytes += bytes.length;
      if (unpackedBytes > MAX_UNPACKED_BYTES) throw new Error('Selected mods exceed the 512 MB unpacked size limit. Download fewer mods at once.');
      mergeModFiles(files, { [download.filename]: bytes });
    } else {
      const incoming = await new Promise<Unzipped>((resolve, reject) => {
        let oversized = false;
        unzip(bytes, { filter: file => {
          unpackedBytes += file.originalSize;
          if (unpackedBytes > MAX_UNPACKED_BYTES) oversized = true;
          return !oversized;
        } }, (error, result) => {
          if (error) reject(error);
          else if (oversized) reject(new Error('Selected mods exceed the 512 MB unpacked size limit. Download fewer mods at once.'));
          else resolve(result);
        });
      });
      mergeModFiles(files, incoming, download.stripPrefix);
    }
  }
  signal?.throwIfAborted();
  if (!Object.keys(files).length) throw new Error('The selected releases contain no mod files.');
  progress('Creating your ZIP…');
  return new Promise((resolve, reject) => {
    zip(files, { level: 1 }, (error, result) => {
      if (error) reject(error);
      else if (signal?.aborted) reject(new Error('Download cancelled.'));
      else resolve(result);
    });
  });
}
