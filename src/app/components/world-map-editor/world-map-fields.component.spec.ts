import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { parsePreset } from './world-map-document';
import { WorldMapFieldsComponent } from './world-map-fields.component';

describe('WorldMapFieldsComponent', () => {
  it('presents registry-first place fields and collapses retail fallback values', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const place = parsePreset(
      '<worldMapPreset version="1" id="custom:test"><places><place id="custom:place" legacyIndex="3" thumbnail="4" services="1" thumbnailId="custom:thumb"><serviceIds><item id="custom:save"/></serviceIds><sounds><item value="7"/></sounds></place></places></worldMapPreset>'
    ).querySelector('place');
    fixture.componentRef.setInput('element', place);
    fixture.componentRef.setInput('registry', { thumbnailDefinitions: ['custom:thumb'], serviceDefinitions: ['custom:save'] });
    fixture.componentRef.setInput('registryLabels', { thumbnailDefinitions: { 'custom:thumb': 'Seles painting' }, serviceDefinitions: { 'custom:save': 'Save point' } });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Thumbnail');
    expect(text).toContain('Seles painting');
    expect(text).toContain('Service');
    expect(text).toContain('Native compatibility');
    expect(text).toContain('Native services mask');
  });

  it('describes reusable definition backends with their registry IDs', () => {
    TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] });
    for (const [selector, expected] of [
      ['thumbnailDefinition', ['Registry ID', 'Native thumbnail index', 'Packaged asset']],
      ['serviceDefinition', ['Registry ID', 'Display label', 'Native service bit']],
      ['submapDestination', ['Registry ID', 'Submap cut', 'Submap scene']],
    ] as const) {
      const fixture = TestBed.createComponent(WorldMapFieldsComponent);
      const element = parsePreset(
        `<worldMapPreset version="1" id="custom:test"><thumbnailDefinitions><thumbnailDefinition id="custom:thumb" nativeIndex="-1" asset="assets/thumb.tim"/></thumbnailDefinitions><serviceDefinitions><serviceDefinition id="custom:save" label="Save point" legacyBit="0"/></serviceDefinitions><submapDestinations><submapDestination id="custom:town" cut="1" scene="2"/></submapDestinations></worldMapPreset>`
      ).querySelector(selector);
      fixture.componentRef.setInput('element', element);
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      for (const label of expected) expect(text).toContain(label);
    }
  });

  it('adds and removes an explicitly empty service-ID collection', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const place = parsePreset(
      '<worldMapPreset version="1" id="custom:test"><places><place id="custom:place" legacyIndex="-1" thumbnail="0" services="0"><sounds/></place></places></worldMapPreset>'
    ).querySelector('place');
    fixture.componentRef.setInput('element', place);
    fixture.componentInstance.mutate.subscribe((action) => action());
    fixture.detectChanges();

    const add = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find((button) => button.textContent?.includes('+ Service'));
    add?.click();
    fixture.detectChanges();
    expect(place.querySelector('serviceIds')).not.toBeNull();
    expect(place.querySelectorAll('serviceIds > item')).toHaveLength(0);

    const remove = fixture.nativeElement.querySelector('button[aria-label="Remove serviceIds"]') as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    expect(place.querySelector('serviceIds')).toBeNull();
  });

  it('uses closed named controls for portal effects while accepting external registry IDs', async () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const portal = parsePreset(
      '<worldMapPreset version="1" id="custom:test"><portals><portal id="custom:portal" legacyIndex="-1" atmosphere="SNOW" smoke="MODE_2" fromId="outside:arrival"/></portals></worldMapPreset>'
    ).querySelector('portal');
    fixture.componentRef.setInput('element', portal);
    fixture.componentRef.setInput('registry', { submapDestinations: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('select[aria-label="Atmosphere"]') as HTMLSelectElement).value).toBe('SNOW');
    expect((fixture.nativeElement.querySelector('input[aria-label="Arrival destination"]') as HTMLInputElement).value).toBe('outside:arrival');
  });
});
