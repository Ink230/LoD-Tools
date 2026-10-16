import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOD_CATALOG, ModListing } from './mod-catalog';
import { createModBundle as buildBundle, mergeModFiles, ModDownload } from './mod-download';

const fixtures: ModDownload[] = [];

function createModBundle(mods: readonly ModListing[], progress: (message: string) => void, signal?: AbortSignal, fetchAsset: typeof fetch = fetch) {
  return buildBundle(mods, progress, signal, fetchAsset, fixtures);
}

async function fixtureAsset(id: string, filename: string, bytes: Uint8Array<ArrayBuffer>, stripPrefix = ''): Promise<void> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  fixtures.push({ id, filename, stripPrefix, url: '', releaseUrl: MOD_CATALOG.find(mod => mod.id === id).releases[0].url, sha256: [...hash].map(value => value.toString(16).padStart(2, '0')).join('') });
}

beforeEach(() => { fixtures.splice(0); });

describe('combined mod downloads', () => {
  it('unpacks ZIPs at the mods root, strips the mods wrapper, and preserves standalone JARs', async () => {
    const modifier = zipSync({ 'mods/dragoon-modifier.jar': strToU8('mod jar'), 'mods/dragoon_modifier/config.ini': strToU8('config') });
    const jar = strToU8('standalone jar');
    await fixtureAsset('dragoon-modifier', 'modifier.zip', modifier, 'mods/');
    await fixtureAsset('no-stats', 'nostats.jar', jar);
    const fetchAsset = vi.fn<typeof fetch>().mockImplementation(async url => new Response(String(url).endsWith('.zip') ? modifier : jar));
    const progress = vi.fn();
    const result = await createModBundle(MOD_CATALOG.filter(mod => ['dragoon-modifier', 'no-stats'].includes(mod.id)), progress, undefined, fetchAsset);
    const files = unzipSync(result);
    expect(Object.keys(files).sort()).toEqual(['dragoon-modifier.jar', 'dragoon_modifier/config.ini', 'nostats.jar']);
    expect(strFromU8(files['nostats.jar'])).toBe('standalone jar');
    expect(strFromU8(files['dragoon_modifier/config.ini'])).toBe('config');
    expect(progress).toHaveBeenLastCalledWith('Creating your ZIP…');
    expect(fetchAsset.mock.calls[0][0]).toBe(`/assets/mod-downloads/dragoon-modifier/${fixtures[0].sha256}/modifier.zip`);
  });

  it('fails on missing, corrupted, or unavailable assets instead of saving a partial bundle', async () => {
    await fixtureAsset('no-stats', 'nostats.jar', strToU8('jar'));
    const mods = MOD_CATALOG.filter(mod => mod.id === 'no-stats');
    await expect(createModBundle(mods, () => undefined, undefined, vi.fn().mockResolvedValue(new Response('', { status: 404 })))).rejects.toThrow('404');
    await expect(createModBundle(mods, () => undefined, undefined, vi.fn().mockResolvedValue(new Response('corrupt')))).rejects.toThrow('incomplete or out of date');
    await expect(createModBundle(MOD_CATALOG.filter(mod => mod.id === 'lloyd'), () => undefined)).rejects.toThrow('no combined download');
  });

  it('rejects unsafe paths and conflicting files rather than silently overwriting', () => {
    const files = { 'mod/config.ini': strToU8('first') };
    expect(() => mergeModFiles(files, { 'MOD/config.ini': strToU8('second') })).toThrow('conflicting files');
    expect(() => mergeModFiles(files, { '../outside.jar': strToU8('bad') })).toThrow('Unsafe archive path');
    expect(() => mergeModFiles(files, { 'C:/outside.jar': strToU8('bad') })).toThrow('Unsafe archive path');
    expect(() => mergeModFiles(files, { 'outside.jar': strToU8('bad') }, 'mods/')).toThrow('Expected');
    expect(() => mergeModFiles(files, { 'mod/config.ini/child': strToU8('bad') })).toThrow('file/folder conflict');
    mergeModFiles(files, { 'mod/config.ini': strToU8('first') });
    expect(Object.keys(files)).toEqual(['mod/config.ini']);
  });

  it('honors cancellation before downloading', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchAsset = vi.fn<typeof fetch>();
    await expect(createModBundle([MOD_CATALOG[0]], () => undefined, controller.signal, fetchAsset)).rejects.toThrow();
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it('does not use a cached older package for a newly displayed release', async () => {
    await fixtureAsset('no-stats', 'nostats.jar', strToU8('old jar'));
    const current = MOD_CATALOG.find(mod => mod.id === 'no-stats');
    const updated = { ...current, releases: [{ version: '1.2', url: 'https://github.com/Popoto-anonymous/No-Stats/releases/tag/Y3' }] };
    const fetchAsset = vi.fn<typeof fetch>();
    await expect(createModBundle([updated], () => undefined, undefined, fetchAsset)).rejects.toThrow('no combined download');
    expect(fetchAsset).not.toHaveBeenCalled();
  });
});
