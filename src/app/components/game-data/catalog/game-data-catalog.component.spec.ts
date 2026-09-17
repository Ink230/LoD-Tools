import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameDataCatalogComponent } from './game-data-catalog.component';

describe('Game Data catalog', () => {
  afterEach(() => vi.unstubAllGlobals());

  function create(section: string) {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ sourceCommit: 'test' }))));
    TestBed.configureTestingModule({ providers: [{ provide: ActivatedRoute, useValue: { data: of({ section }) } }] });
    return TestBed.createComponent(GameDataCatalogComponent).componentInstance;
  }

  it('lists every Dragoon level including Dart’s Divine form', async () => {
    const component = create('dragoons');
    await vi.waitFor(() => expect(component.loading).toBe(false));
    expect(component.error).toBe('');
    expect(component.rows).toHaveLength(50);
    component.category = 'Dart';
    component.search = 'Divine';
    component.filter();
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
    component.filter();
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
