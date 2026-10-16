import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOD_CATALOG } from './mod-catalog';
import { applyLatestRelease, MOD_RELEASE_CACHE_KEY, modRepository, ModReleasesService } from './mod-releases.service';

const irongoon = MOD_CATALOG.find(mod => mod.id === 'irongoon');
const newRelease = {
  tag_name: 'v0.4.19', name: 'v0.4.19 for RB3', body: '', draft: false, prerelease: false,
  html_url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.19',
};

describe('live mod releases', () => {
  beforeEach(() => {
    const entries = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value); },
      removeItem: (key: string) => { entries.delete(key); },
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('restores saved release data before fetching and retains it when fresh checks fail', async () => {
    localStorage.setItem(MOD_RELEASE_CACHE_KEY, JSON.stringify({
      irongoon: { baseUrl: irongoon.releases[0].url, baseVersion: irongoon.releases[0].version, release: newRelease },
    }));
    const service = new ModReleasesService();
    expect(service.catalog().find(mod => mod.id === 'irongoon').releases[0].version).toBe('0.4.19');
    expect(service.catalog().find(mod => mod.id === 'irongoon').tags).toEqual(irongoon.tags);
    await service.refresh(vi.fn<typeof fetch>().mockRejectedValue(new Error('Offline')));
    expect(service.catalog().find(mod => mod.id === 'irongoon').releases[0].version).toBe('0.4.19');
    expect(service.loading()).toBe(false);
  });

  it('saves fresh responses and restores them in a new page session', async () => {
    const service = new ModReleasesService();
    await service.refresh(vi.fn<typeof fetch>().mockImplementation(async url => String(url).includes('/Ink230/irongoon/')
      ? new Response(JSON.stringify(newRelease)) : new Response('', { status: 404 })));
    const saved = JSON.parse(localStorage.getItem(MOD_RELEASE_CACHE_KEY));
    expect(saved.irongoon.release.tag_name).toBe('v0.4.19');
    expect(saved.irongoon.baseVersion).toBe('0.4.18');
    const reloaded = new ModReleasesService();
    expect(reloaded.catalog().find(mod => mod.id === 'irongoon').releases[0].url).toBe(newRelease.html_url);
  });

  it('ignores broken cache data, mismatched repositories, and outdated baked baselines', () => {
    localStorage.setItem(MOD_RELEASE_CACHE_KEY, '{');
    expect(new ModReleasesService().catalog()).toBe(MOD_CATALOG);
    for (const entry of [
      { baseUrl: irongoon.releases[0].url, baseVersion: '0.4.10', release: newRelease },
      { baseUrl: irongoon.releases[0].url, baseVersion: irongoon.releases[0].version, release: { ...newRelease, html_url: 'https://example.com/wrong' } },
    ]) {
      localStorage.setItem(MOD_RELEASE_CACHE_KEY, JSON.stringify({ irongoon: entry }));
      expect(new ModReleasesService().catalog()).toBe(MOD_CATALOG);
    }
  });

  it('continues refreshing when localStorage is unavailable', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    const service = new ModReleasesService();
    expect(service.catalog()).toBe(MOD_CATALOG);
    await service.refresh(vi.fn<typeof fetch>().mockImplementation(async url => String(url).includes('/Ink230/irongoon/')
      ? new Response(JSON.stringify(newRelease)) : new Response('', { status: 404 })));
    expect(service.catalog().find(mod => mod.id === 'irongoon').releases[0].version).toBe('0.4.19');
    expect(service.loading()).toBe(false);
  });

  it('uses the release repository rather than a related project repository', () => {
    expect(modRepository(MOD_CATALOG.find(mod => mod.id === 'archipelago'))).toBe('pkolb-dev/Archipelagoon');
    expect(modRepository(MOD_CATALOG.find(mod => mod.id === 'lloyd'))).toBeUndefined();
    expect(modRepository(MOD_CATALOG.find(mod => mod.id === 'upscale'))).toBeUndefined();
  });

  it('starts with baked data and updates each response without mutating it or rechecking on route changes', async () => {
    const requests = new Map<string, (response: Response) => void>();
    const fetchRelease = vi.fn<typeof fetch>().mockImplementation(url => new Promise(resolve => { requests.set(String(url), resolve); }));
    const service = new ModReleasesService();
    const refresh = service.refresh(fetchRelease);
    expect(service.loading()).toBe(true);
    expect(service.catalog()).toBe(MOD_CATALOG);
    for (const [url, resolve] of requests) {
      resolve(url.includes('/Ink230/irongoon/') ? new Response(JSON.stringify(newRelease)) : new Response('', { status: 404 }));
    }
    await refresh;
    expect(service.loading()).toBe(false);
    const updated = service.catalog().find(mod => mod.id === 'irongoon');
    expect(updated.releases[0]).toEqual({ version: '0.4.19', compatibility: 'RB3', url: newRelease.html_url });
    expect(updated.releases[1]).toEqual(irongoon.releases[1]);
    expect(updated.releaseNote).not.toContain('v0.4.18');
    expect(updated.releaseNote).toContain('v0.5.1 requires');
    expect(irongoon.releases[0].version).toBe('0.4.18');
    const callCount = fetchRelease.mock.calls.length;
    await service.refresh(fetchRelease);
    expect(fetchRelease).toHaveBeenCalledTimes(callCount);
  });

  it('keeps saved versions for failed or malformed responses while updating successful ones', async () => {
    const fetchRelease = vi.fn<typeof fetch>().mockImplementation(async url => {
      if (String(url).includes('/Ink230/irongoon/')) return new Response('', { status: 403 });
      if (String(url).includes('/avionanx/tlot/')) return new Response('{}');
      if (String(url).includes('/Zychronix/icon-turn-order/')) return new Response(JSON.stringify({ ...newRelease, tag_name: '1.4', name: 'Icon Turn Order 1.4', html_url: 'https://github.com/Zychronix/icon-turn-order/releases/tag/1.4' }));
      return new Response('', { status: 404 });
    });
    const service = new ModReleasesService();
    await service.refresh(fetchRelease);
    expect(service.catalog().find(mod => mod.id === 'irongoon')).toBe(irongoon);
    expect(service.catalog().find(mod => mod.id === 'legend-of-tides')).toBe(MOD_CATALOG.find(mod => mod.id === 'legend-of-tides'));
    expect(service.catalog().find(mod => mod.id === 'icon-turn-order').releases[0].version).toBe('1.4');
  });

  it('preserves curated labels for already listed custom tags and beta tools', () => {
    for (const id of ['no-stats', 'assets-manager']) {
      const mod = MOD_CATALOG.find(entry => entry.id === id);
      const updated = applyLatestRelease(mod, { ...newRelease, tag_name: 'custom-tag', html_url: mod.releases[0].url });
      expect(updated).toBe(mod);
    }
  });

  it('does not carry RB3 compatibility onto a new release without an affirmative declaration', () => {
    const unknown = applyLatestRelease(irongoon, { ...newRelease, name: 'v0.4.19', body: '' });
    expect(unknown.releases[0].compatibility).toBe('Check compatibility');
    const incompatible = applyLatestRelease(irongoon, { ...newRelease, name: 'v0.4.19', body: 'Not compatible with RB3.' });
    expect(incompatible.releases[0].compatibility).toBe('Check compatibility');
    const tools = MOD_CATALOG.find(mod => mod.id === 'assets-manager');
    expect(applyLatestRelease(tools, { ...newRelease, tag_name: 'v0.3', html_url: tools.infoUrl + '/releases/tag/v0.3' }).releases[0].compatibility).toBeUndefined();
  });

  it('derives versions from release assets for non-versioned tags and rejects invalid or unrelated releases', () => {
    const mod = MOD_CATALOG.find(entry => entry.id === 'no-stats');
    const updated = applyLatestRelease(mod, { ...newRelease, tag_name: 'Y3', name: 'Updated gear', html_url: mod.infoUrl + '/releases/tag/Y3', assets: [{ name: 'nostats-1.2.jar' }] });
    expect(updated.releases[0].version).toBe('1.2');
    expect(() => applyLatestRelease(irongoon, { ...newRelease, prerelease: true })).toThrow('Invalid');
    expect(() => applyLatestRelease(irongoon, { ...newRelease, html_url: 'https://example.com/release' })).toThrow('does not match');
  });
});
