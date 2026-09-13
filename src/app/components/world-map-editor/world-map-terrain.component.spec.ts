import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { guideTransform, validGuide, WorldMapTerrainComponent } from './world-map-terrain.component';

describe('terrain guides', () => {
  const south = { region: 'south', image: 'south.png', x: -100, z: 20, width: 400, height: 200 };
  it('selects a single region and uses its custom guide before native terrain', () => {
    const component = TestBed.createComponent(WorldMapTerrainComponent).componentInstance;
    component.native = [south, { ...south, region: 'north', image: 'north.png' }];
    expect(component.active).toBeUndefined();
    component.region = 'south';
    expect(component.active).toBe(south);
    component.custom = [{ ...south, image: 'custom.png' }];
    expect(component.active?.image).toBe('custom.png');
    component.region = 'north';
    expect(component.active?.image).toBe('north.png');
    component.region = 'unknown';
    expect(component.active).toBeUndefined();
  });
  it('rotates in X/Z coordinates around the image center', () => {
    expect(guideTransform({ ...south, rotation: 90 })).toBe('rotate(90 100 120)');
  });
  it('rejects unusable guide bounds before loading persisted or native guides', () => {
    expect(validGuide(south)).toBe(true);
    expect(validGuide({ ...south, width: 0 })).toBe(false);
    expect(validGuide({ ...south, z: Infinity })).toBe(false);
    expect(validGuide({ ...south, rotation: '90' })).toBe(false);
  });
});
