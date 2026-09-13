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

  it('adds an empty service-ID collection without a section delete button', () => {
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
    expect(remove).toBeNull();
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
  it('reorders point rows and updates the connected start node', () => {
    const component = new WorldMapFieldsComponent();
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><nodes><node id="custom:n"><position x="0" y="0" z="0"/></node></nodes><geometry><geometry id="custom:g"><points><item x="0" y="0" z="0"/><item x="12.34" y="5" z="6"/><item x="20" y="0" z="0"/></points></geometry></geometry><routes><route id="custom:r" geometry="custom:g" start="custom:n" end="custom:other" direction="1"/></routes></worldMapPreset>');
    component.element = doc.querySelector('points');
    const target = component.element.firstElementChild;
    const source = target.nextElementSibling;
    component.dragPoint = source;
    component.mutate.subscribe((change) => change());
    component.dropPoint(target, { preventDefault() {}, stopPropagation() {}, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 40 }) } } as unknown as DragEvent);
    expect(component.element.firstElementChild).toBe(source);
    expect(doc.querySelector('position').getAttribute('x')).toBe('12.34');
  });
  it('uses the shared coordinate row for region camera vectors', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera><viewpoint x="1" y="2" z="3"/><refpoint x="4" y="5" z="6"/><minimum x="0" y="0" z="0"/><maximum x="10" y="10" z="10"/></camera></region></regions></worldMapPreset>');
    fixture.componentRef.setInput('element', doc.querySelector('region'));
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.coordinates') as NodeListOf<HTMLElement>;
    expect(rows.length).toBe(4);
    for (const row of rows) expect(row.querySelectorAll('input').length).toBe(3);
  });
  it('updates direction immediately when a different route is selected', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><routes><route id="custom:forward" direction="1"/><route id="custom:reverse" direction="-1"/></routes><nodes><node id="custom:node"/></nodes></worldMapPreset>');
    const [forward, reverse] = Array.from(doc.querySelectorAll('route'));
    for (const route of [reverse, forward, reverse]) {
      fixture.componentRef.setInput('element', doc.querySelector('node'));
      fixture.detectChanges();
      fixture.componentRef.setInput('element', route);
      fixture.detectChanges();
      expect((fixture.nativeElement.querySelector('select[aria-label="Direction"]') as HTMLSelectElement).value).toBe(route.getAttribute('direction'));
    }
  });
  it('creates registry suggestions only for the focused reference row', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><storyPresets><storyPreset id="custom:story"><enabledPortals><item id="custom:a"/><item id="custom:b"/></enabledPortals></storyPreset></storyPresets></worldMapPreset>');
    fixture.componentRef.setInput('element', doc.querySelector('storyPreset'));
    fixture.componentRef.setInput('registry', { portals: ['custom:a', 'custom:b'] });
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[list]') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].getAttribute('list')).not.toBe(inputs[1].getAttribute('list'));
    expect(fixture.nativeElement.querySelectorAll('datalist').length).toBe(0);
    inputs[0].dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('datalist option').length).toBe(2);
    inputs[0].dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('datalist').length).toBe(0);
  });
  it('preserves loaded precision and rounds an edited coordinate to two decimals', () => {
    const fixture = TestBed.configureTestingModule({ imports: [WorldMapFieldsComponent] }).createComponent(WorldMapFieldsComponent);
    const point = parsePreset('<worldMapPreset version="1" id="custom:test"><nodes><node id="custom:n"><position x="123.45678" y="4.56789" z="0"/></node></nodes></worldMapPreset>').querySelector('position');
    fixture.componentRef.setInput('element', point);
    fixture.componentInstance.mutate.subscribe(action => action());
    fixture.detectChanges();
    expect(point.getAttribute('x')).toBe('123.45678');
    const input = document.createElement('input');
    input.value = '234.56789';
    fixture.componentInstance.set('x', { target: input } as unknown as Event);
    expect(point.getAttribute('x')).toBe('234.57');
    expect(point.getAttribute('y')).toBe('4.56789');
  });
});
