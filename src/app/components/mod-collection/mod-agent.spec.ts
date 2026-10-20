import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MOD_CATALOG } from './mod-catalog';
import { ModCollectionComponent } from './mod-collection.component';
import { applyLatestRelease, ModReleasesService } from './mod-releases.service';

describe('mod agent actions and shareable state', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideRouter([{ path: 'mods', component: ModCollectionComponent }]),
    { provide: ModReleasesService, useFactory: () => ({ catalog: signal(MOD_CATALOG), loading: signal(false), refresh: () => Promise.resolve() }) },
  ] }));

  it('restores URL filters and keeps visible controls and URLs synchronized', async () => {
    const harness = await RouterTestingHarness.create('/mods?q=lloyd&version=RB3&sort=name');
    const component = harness.routeDebugElement.componentInstance as ModCollectionComponent;
    expect(component.query()).toBe('lloyd');
    expect(component.version()).toBe('RB3');
    expect(component.filtered().map(mod => mod.id)).toEqual(['lloyd']);
    await component.setFilters({ query: 'stats', version: '', sort: 'author' });
    expect(TestBed.inject(Router).url).toContain('q=stats');
    expect(TestBed.inject(Router).url).toContain('sort=author');
    expect(component.filtered().map(mod => mod.id)).toContain('no-stats');
    await TestBed.inject(Router).navigateByUrl('/mods?q=irongoon&version=invalid&sort=invalid');
    expect(component.query()).toBe('irongoon');
    expect(component.version()).toBe('');
    expect(component.sort()).toBe('featured');
  });

  it('changes selections atomically and excludes tools, unknown IDs and unreleased mods', async () => {
    const harness = await RouterTestingHarness.create('/mods');
    const component = harness.routeDebugElement.componentInstance as ModCollectionComponent;
    component.setAgentSelection({ ids: ['lloyd', 'dragoon-modifier'] });
    expect(component.selectionState().selected.map(mod => mod.id)).toEqual(['dragoon-modifier', 'lloyd']);
    for (const ids of [['irongoon', 'upscale'], ['upscale'], ['unknown'], [MOD_CATALOG.find(mod => mod.section === 'tools').id], ['irongoon', 'irongoon']]) {
      expect(() => component.setAgentSelection({ ids })).toThrow();
      expect(component.selected().size).toBe(2);
    }
    component.setAgentSelection({ ids: [] });
    expect(component.selected().size).toBe(0);
  });

  it('blocks actions while loading or packaging, and refuses an uncached fresh release', async () => {
    const harness = await RouterTestingHarness.create('/mods');
    const component = harness.routeDebugElement.componentInstance as ModCollectionComponent;
    const releases = TestBed.inject(ModReleasesService);
    releases.loading.set(true);
    expect(() => component.setAgentSelection({ ids: ['irongoon'] })).toThrow('Wait');
    releases.loading.set(false);
    component.downloading.set(true);
    expect(() => component.setAgentSelection({ ids: [] })).toThrow('Wait');
    component.downloading.set(false);
    releases.catalog.update(mods => mods.map(mod => mod.id !== 'irongoon' ? mod : applyLatestRelease(mod, {
      html_url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.19', tag_name: 'v0.4.19', draft: false, prerelease: false,
    })));
    expect(() => component.setAgentSelection({ ids: ['irongoon'] })).toThrow('uncached');
    expect(component.selected().size).toBe(0);
  });
});
