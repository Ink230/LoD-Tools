import { DOCUMENT } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MOD_CATALOG } from '../components/mod-collection/mod-catalog';
import { applyLatestRelease, ModReleasesService } from '../components/mod-collection/mod-releases.service';
import { BrowserTool } from './browser-agent';
import { BrowserAgentService } from './browser-agent.service';

@Component({ template: '' })
class PageComponent {}

describe('browser agent catalog tools', () => {
  let document: Document;
  const tools = new Map<string, BrowserTool>();

  beforeEach(() => {
    tools.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(['mods', 'data/items', 'asset-viewer'].map(path => ({ path, component: PageComponent }))), {
      provide: ModReleasesService, useFactory: () => ({ catalog: signal(MOD_CATALOG), loading: signal(false), refresh: vi.fn(async () => undefined) }),
    }] });
    document = TestBed.inject(DOCUMENT);
    Object.defineProperty(document, 'modelContext', { configurable: true, value: {
      registerTool: (tool: BrowserTool) => { tools.set(tool.name, tool); return Promise.resolve(); },
    } });
    TestBed.inject(BrowserAgentService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'modelContext');
    document.querySelector('link[data-agent-alternate]')?.remove();
  });

  it('returns current releases and rejects ZIP eligibility for uncached newer versions', async () => {
    const releases = TestBed.inject(ModReleasesService);
    releases.catalog.update(mods => mods.map(mod => mod.id !== 'irongoon' ? mod : applyLatestRelease(mod, {
      html_url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.19', tag_name: 'v0.4.19', draft: false, prerelease: false,
    })));
    const result = JSON.parse(await tools.get('search_mods').execute({ query: 'irongoon' }));
    expect(result.mods).toHaveLength(1);
    expect(result.mods[0].releases[0].version).toBe('0.4.19');
    expect(result.mods[0].zipEligible).toBe(false);
    expect(releases.refresh).toHaveBeenCalledOnce();
  });

  it('validates input before any network refresh and exposes public routes', async () => {
    await expect(tools.get('search_mods').execute({ query: 'x'.repeat(201) })).rejects.toThrow();
    await expect(tools.get('search_mods').execute({ version: 'pretend' })).rejects.toThrow();
    expect(TestBed.inject(ModReleasesService).refresh).not.toHaveBeenCalled();
    const pages = JSON.parse(await tools.get('list_pages').execute({}));
    expect(pages.routes.some((route: { path: string }) => route.path === '/asset-viewer')).toBe(true);
    expect(pages.manifest).toBe('/agent/index.json');
  });

  it('updates titles and advertises only the alternate that belongs to the current page', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/mods?q=lloyd');
    expect(document.title).toBe('Mods | Dragoon Mods');
    expect(document.querySelector('link[data-agent-alternate]')?.getAttribute('href')).toBe('/agent/mods.md');
    await router.navigateByUrl('/data/items');
    expect(document.title).toBe('Items | Dragoon Mods');
    expect(document.querySelector('link[data-agent-alternate]')?.getAttribute('href')).toBe('/assets/game-data/items.json');
    await router.navigateByUrl('/asset-viewer');
    expect(document.querySelector('link[data-agent-alternate]')).toBeNull();
  });

  it('queries complete game tables with bounded pagination and cancellation, and blocks arbitrary fetch targets', async () => {
    const fetchData = vi.fn(async () => ({ ok: true, json: async () => Array.from({ length: 60 }, (_, id) => ({ id, name: `Potion ${id}` })) }));
    vi.stubGlobal('fetch', fetchData);
    const controller = new AbortController();
    const result = JSON.parse(await tools.get('query_game_data').execute({ dataset: 'items', query: 'potion', offset: 1, limit: 2 }, { signal: controller.signal }));
    expect(result.total).toBe(60);
    expect(result.rows.map((row: { id: number }) => row.id)).toEqual([1, 2]);
    expect(fetchData).toHaveBeenCalledWith('/assets/game-data/items.json', { signal: controller.signal });
    await expect(tools.get('query_game_data').execute({ dataset: '../private' })).rejects.toThrow();
    await expect(tools.get('query_game_data').execute({ dataset: 'items', limit: 101 })).rejects.toThrow();
    await expect(tools.get('query_game_data').execute({ dataset: 'items', offset: 1.5 })).rejects.toThrow();
    expect(fetchData).toHaveBeenCalledOnce();
  });
});
