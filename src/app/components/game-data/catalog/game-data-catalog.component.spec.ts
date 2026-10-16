import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { RouterTestingHarness } from '@angular/router/testing';
import { GameDataService } from '../../../services/game-data.service';
import { GameDataCatalogComponent } from './game-data-catalog.component';

describe('Game Data catalog', () => {
  afterEach(() => vi.unstubAllGlobals());

  function create(section: string) {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ sourceCommit: 'test' }))));
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: ActivatedRoute, useValue: { data: of({ section }), queryParamMap: of(convertToParamMap({})) },
    }] });
    return TestBed.createComponent(GameDataCatalogComponent).componentInstance;
  }

  it('lists every Dragoon level including Dart’s Divine form', async () => {
    const component = create('dragoons');
    await vi.waitFor(() => expect(component.loading).toBe(false));
    expect(component.error).toBe('');
    expect(component.rows).toHaveLength(50);
    component.category = 'Dart';
    component.search = 'Divine';
    component.filter(false);
    expect(component.filteredRows).toHaveLength(5);
    expect(component.filteredRows.map(row => row['mp'])).toEqual([20, 40, 60, 80, 100]);
  });

  it('lists five levels per addition and combines character and text filters', async () => {
    const component = create('additions');
    await vi.waitFor(() => expect(component.loading).toBe(false));
    expect(component.error).toBe('');
    expect(component.rows).toHaveLength(175);
    component.category = 'Dart';
    component.search = 'Double Slash';
    component.filter(false);
    expect(component.filteredRows).toHaveLength(5);
    expect(component.filteredRows.every(row => row['hits'] === 2)).toBe(true);
  });

  it('reports unavailable catalogs without leaving stale entries visible', async () => {
    const component = create('dragoons');
    await vi.waitFor(() => expect(component.loading).toBe(false));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await component.load('items');
    expect(component.error).toContain('could not be loaded');
    expect(component.filteredRows).toEqual([]);
    expect(component.loading).toBe(false);
  });
});

describe('game catalog query URLs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [
      { name: 'Healing Potion', category: 'Consumable' }, { name: 'Sword', category: 'Weapon' },
    ] })));
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'data/items', component: GameDataCatalogComponent, data: { section: 'items' } }]),
      { provide: GameDataService, useValue: { characterData: [] } },
    ] });
    TestBed.overrideComponent(GameDataCatalogComponent, { set: { template: '' } });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('restores filters before asynchronous data arrives and restores changed query URLs on a reused route', async () => {
    const harness = await RouterTestingHarness.create('/data/items?q=potion&category=Consumable');
    await harness.fixture.whenStable();
    const component = harness.routeDebugElement.componentInstance as GameDataCatalogComponent;
    expect(component.search).toBe('potion');
    expect(component.filteredRows.map(row => row['name'])).toEqual(['Healing Potion']);
    await component.load();
    expect(component.category).toBe('Consumable');
    await TestBed.inject(Router).navigateByUrl('/data/items?q=sword');
    expect(component.category).toBe('');
    expect(component.filteredRows.map(row => row['name'])).toEqual(['Sword']);
    component.search = 'potion';
    component.filter();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/data/items?q=potion');
  });
});
