import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Injector, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import routes from '../../assets/agent-routes.json';
import { registerBrowserTools, toolInput, toolInteger, toolString } from './browser-agent';

const DATASETS = ['spells', 'items', 'submaps', 'stages', 'encounters', 'enemies'];

@Injectable({ providedIn: 'root' })
export class BrowserAgentService {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const dispose = registerBrowserTools(this.document, [
      {
        name: 'search_mods', description: 'Search current session mods, release URLs, compatibility and ZIP eligibility. Includes saved and freshly checked versions.',
        inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 200 }, version: { type: 'string', enum: ['', 'RB3', 'Latest SC', 'Special build', 'Check compatibility'] } }, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async input => {
          const args = toolInput(input, ['query', 'version']);
          const query = toolString(args['query']);
          const version = toolString(args['version']);
          if (!['', 'RB3', 'Latest SC', 'Special build', 'Check compatibility'].includes(version)) throw new Error('Unknown compatibility filter');
          // Keep catalog and ZIP code out of the initial bundle on editor pages.
          const [{ ModReleasesService }, { filterMods }, { modDownload }] = await Promise.all([
            import('../components/mod-collection/mod-releases.service'),
            import('../components/mod-collection/mod-collection-state'),
            import('../components/mod-collection/mod-download'),
          ]);
          const releases = this.injector.get(ModReleasesService);
          await releases.refresh();
          return JSON.stringify({ freshness: 'Current browser session catalog; failed release checks retain saved or baked versions',
            mods: filterMods(releases.catalog(), query, version, 'featured').map(mod => ({
              ...mod, pageUrl: `/mods#mod-${mod.id}`, zipEligible: mod.section !== 'tools' && !!modDownload(mod),
            })) });
        },
      },
      {
        name: 'query_game_data', description: 'Search complete public source tables without scrolling virtualized grids. Returns paginated snapshot rows and provenance.',
        inputSchema: { type: 'object', properties: {
          dataset: { type: 'string', enum: DATASETS }, query: { type: 'string', maxLength: 200 },
          offset: { type: 'integer', minimum: 0, maximum: 100000 }, limit: { type: 'integer', minimum: 1, maximum: 100 },
        }, required: ['dataset'], additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: async (input, options) => {
          const args = toolInput(input, ['dataset', 'query', 'offset', 'limit']);
          const dataset = toolString(args['dataset']);
          if (!DATASETS.includes(dataset)) throw new Error('Unknown game-data table');
          const query = toolString(args['query']).trim().toLowerCase().split(/\s+/);
          const offset = toolInteger(args['offset'], 0, 0, 100000);
          const limit = toolInteger(args['limit'], 25, 1, 100);
          const response = await fetch(`/assets/game-data/${dataset}.json`, { signal: options?.signal });
          if (!response.ok) throw new Error('Game data could not be loaded');
          const value: unknown = await response.json();
          if (!Array.isArray(value)) throw new Error('Invalid game data');
          const rows = value.filter(row => query.every(term => JSON.stringify(row).toLowerCase().includes(term)));
          return JSON.stringify({ dataset, provenance: '/assets/game-data/provenance.json', total: rows.length, offset, rows: rows.slice(offset, offset + limit) });
        },
      },
      {
        name: 'list_pages', description: 'List public Dragoon Mods pages, static data and guide URLs. Editors need user-chosen local files.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
        execute: async input => {
          toolInput(input, []);
          return JSON.stringify({ routes, manifest: '/agent/index.json', guide: '/agent/guide.md' });
        },
      },
    ]);
    inject(DestroyRef).onDestroy(dispose);
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationEnd) this.updateMetadata(event.urlAfterRedirects);
    });
    this.updateMetadata(this.router.url);
  }

  private updateMetadata(url: string): void {
    const path = url.split(/[?#]/)[0];
    const page = routes.find(route => route.path === (path === '/' ? '/mods' : path))
      || (path.startsWith('/data/character/') ? routes.find(route => route.path === '/data/character/dart') : undefined);
    this.title.setTitle(page ? `${page.title} | Dragoon Mods` : 'Dragoon Mods');
    this.meta.updateTag({ name: 'description', content: page?.description || 'Mods, tools, randomizers and more for Legend of Dragoon' });
    const dataset = path.match(/^\/data\/(spells|items|submaps|stages|encounters|enemies)$/)?.[1];
    const isMods = path === '/' || path === '/mods';
    const previous = this.document.querySelector<HTMLLinkElement>('link[data-agent-alternate]');
    if (!isMods && !dataset) {
      previous?.remove();
      return;
    }
    const alternate = previous || this.document.createElement('link');
    alternate.setAttribute('data-agent-alternate', '');
    alternate.rel = 'alternate';
    alternate.type = isMods ? 'text/markdown' : 'application/json';
    alternate.href = isMods ? '/agent/mods.md' : `/assets/game-data/${dataset}.json`;
    alternate.title = isMods ? 'Mod catalog snapshot' : 'Complete game-data snapshot';
    if (!previous) this.document.head.append(alternate);
  }
}
