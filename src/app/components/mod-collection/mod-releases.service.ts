import { Injectable, signal } from '@angular/core';
import { MOD_CATALOG, ModListing, ModRelease } from './mod-catalog';

interface GitHubRelease {
  readonly html_url: string;
  readonly tag_name: string;
  readonly name?: string;
  readonly body?: string;
  readonly assets?: readonly { readonly name: string }[];
}

export const MOD_RELEASE_CACHE_KEY = 'dragoonmods.latest-releases.v1';

interface CachedModRelease {
  readonly baseUrl?: string;
  readonly baseVersion?: string;
  readonly release: unknown;
}

export function modRepository(mod: ModListing): string | undefined {
  const url = mod.releases.find(release => release.url?.startsWith('https://github.com/'))?.url || mod.infoUrl;
  return url?.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)(?:\/|$)/)?.[1];
}

function releaseVersion(release: GitHubRelease): string {
  const tag = release.tag_name.match(/^v?(\d+(?:\.\d+)+(?:[-+][\w.-]+)?)$/i);
  if (tag) return tag[1];
  const named = release.name?.match(/\bv?(\d+(?:\.\d+)+)(?:[ -](beta|alpha|rc)\b)?/i);
  if (named) return named[1] + (named[2] ? ` ${named[2]}` : '');
  const asset = release.assets?.find(item => /\.(jar|zip)$/i.test(item.name) && !/source/i.test(item.name));
  return asset?.name.match(/[-_]v?(\d+(?:\.\d+)+)(?:[-.][\w-]+)?\.(?:jar|zip)$/i)?.[1] || release.tag_name;
}

export function applyLatestRelease(mod: ModListing, value: unknown): ModListing {
  const data = value as Record<string, unknown> | null;
  if (!data || typeof data['tag_name'] !== 'string' || !data['tag_name'].trim() || typeof data['html_url'] !== 'string'
    || data['draft'] !== false || data['prerelease'] !== false) throw new Error('Invalid latest release');
  const repository = modRepository(mod);
  if (!repository || !data['html_url'].toLowerCase().startsWith(`https://github.com/${repository.toLowerCase()}/releases/tag/`)) {
    throw new Error('Latest release URL does not match the mod repository');
  }
  const release: GitHubRelease = {
    html_url: data['html_url'], tag_name: data['tag_name'],
    name: typeof data['name'] === 'string' ? data['name'] : undefined,
    body: typeof data['body'] === 'string' ? data['body'] : undefined,
    assets: Array.isArray(data['assets']) ? data['assets'].filter((asset): asset is { name: string } => !!asset && typeof asset.name === 'string') : [],
  };
  const exact = mod.releases.find(known => known.url === release.html_url);
  if (exact) return mod;
  const version = releaseVersion(release);
  const known = mod.releases.find(previous => previous.version === version && previous.url?.endsWith('/releases'));
  const notes = `${release.name || ''}\n${release.body || ''}`;
  const mentionsRb3 = /\b(?:for|supports?|requires?|compatib(?:le|ility)\s+with)\s+(?:(?:SC|Severed\s+Chains)\s+)?(?:RB\s*3|recommended\s+build\s*3)\b/i.test(notes)
    || /^\s*RB\s*3\b/i.test(release.name || '');
  const deniesRb3 = /\b(?:not|no longer|incompatible|unsupported)[^.\n]{0,50}\bRB\s*3\b|\bRB\s*3\b[^.\n]{0,50}(?:not supported|unsupported|incompatible)/i.test(notes);
  const explicitRb3 = mentionsRb3 && !deniesRb3;
  const latest: ModRelease = {
    version: known?.version || version,
    url: release.html_url,
    compatibility: mod.section === 'tools' ? undefined : known?.compatibility || (explicitRb3 ? 'RB3' : 'Check compatibility'),
  };
  const previous = mod.releases[0];
  const remaining = mod.releases.filter(item => item.url !== latest.url && (item.compatibility === 'Special build' || latest.compatibility === 'Special build'));
  // Keep notes about separately maintained special builds, without carrying an
  // old primary version's compatibility claim onto the newly published release.
  const preservedNote = mod.releaseNote?.split(/(?<=[.!?])\s+/).filter(sentence => !previous?.version || !sentence.includes(`v${previous.version}`)).join(' ');
  const compatibilityNote = latest.compatibility === 'Check compatibility' ? 'Check the latest release notes for SC compatibility.' : '';
  return {
    ...mod,
    inDevelopment: false,
    releases: [latest, ...remaining],
    releaseNote: [compatibilityNote, preservedNote].filter(Boolean).join(' ') || undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class ModReleasesService {
  readonly catalog = signal<readonly ModListing[]>(MOD_CATALOG);
  readonly status = signal('');
  readonly loading = signal(false);
  private refreshTask?: Promise<void>;
  private readonly cachedReleases: Record<string, CachedModRelease> = {};

  constructor() {
    this.restoreCache();
  }

  private restoreCache(): void {
    let saved: Record<string, CachedModRelease>;
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(MOD_RELEASE_CACHE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
      saved = parsed as Record<string, CachedModRelease>;
    } catch {
      return;
    }
    const catalog = MOD_CATALOG.map(mod => {
      const entry = saved[mod.id];
      // A new baked-in release invalidates an older cache baseline for this mod.
      if (!entry || entry.baseUrl !== mod.releases[0]?.url || entry.baseVersion !== mod.releases[0]?.version) return mod;
      try {
        const updated = applyLatestRelease(mod, entry.release);
        this.cachedReleases[mod.id] = entry;
        return updated;
      } catch {
        return mod;
      }
    });
    if (catalog.some((mod, index) => mod !== MOD_CATALOG[index])) this.catalog.set(catalog);
  }

  private saveRelease(mod: ModListing, release: unknown): void {
    this.cachedReleases[mod.id] = { baseUrl: mod.releases[0]?.url, baseVersion: mod.releases[0]?.version, release };
    try {
      localStorage.setItem(MOD_RELEASE_CACHE_KEY, JSON.stringify(this.cachedReleases));
    } catch {
      // Storage may be disabled or full; the current page still uses fresh data.
    }
  }

  refresh(fetchRelease: typeof fetch = fetch): Promise<void> {
    // Reusing the root service across route changes avoids repeated GitHub calls.
    return this.refreshTask ??= this.checkReleases(fetchRelease);
  }

  private async checkReleases(fetchRelease: typeof fetch): Promise<void> {
    this.loading.set(true);
    this.status.set('Checking latest published releases…');
    try {
      const checks = await Promise.allSettled(MOD_CATALOG.filter(mod => modRepository(mod)).map(async mod => {
        const response = await fetchRelease(`https://api.github.com/repos/${modRepository(mod)}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10_000),
        });
        if (response.status === 404) return;
        if (!response.ok) throw new Error(`Release check failed (${response.status})`);
        const release: unknown = await response.json();
        const updated = applyLatestRelease(mod, release);
        this.catalog.update(catalog => catalog.map(entry => entry.id === mod.id ? updated : entry));
        this.saveRelease(mod, release);
      }));
      const failures = checks.filter(check => check.status === 'rejected').length;
      this.status.set(failures ? 'Some release checks are unavailable. Saved versions are shown for those mods.' : '');
    } finally {
      this.loading.set(false);
    }
  }
}
