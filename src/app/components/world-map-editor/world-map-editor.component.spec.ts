import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorldMapEditorComponent } from './world-map-editor.component';

describe('world map graph editing', () => {
  let editor: WorldMapEditorComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: ChangeDetectorRef, useValue: { markForCheck: (): void => undefined } }] });
    editor = TestBed.runInInjectionContext(() => new WorldMapEditorComponent());
    editor.ngOnInit();
  });

  it('nudges selected nodes without changing height and restores edits with undo/redo', () => {
    editor.createEntry();
    const node = editor.selected;
    node.querySelector('position').setAttribute('y', '27');
    editor.mapKey(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }));
    expect(editor.nodes[0].x).toBe(10);
    expect(node.querySelector('position').getAttribute('y')).toBe('27');
    editor.undo();
    expect(editor.nodes[0].x).toBe(0);
    editor.redo();
    expect(editor.nodes[0].x).toBe(10);
  });

  it('inserts geometry points and prevents reducing a path below two points', () => {
    editor.chooseSection('geometry');
    editor.createEntry();
    editor.addPoint(150, 25);
    expect(editor.handles.length).toBe(3);
    editor.removePoint();
    expect(editor.handles.length).toBe(2);
    editor.pointIndex = 0;
    editor.removePoint();
    expect(editor.handles.length).toBe(2);
    expect(editor.error).toContain('at least two');
  });

  it('creates registry-safe IDs for multiword authoring definitions', () => {
    editor.chooseSection('thumbnailDefinitions');
    editor.createEntry();
    expect(editor.selected?.getAttribute('id')).toBe('custom:thumbnail_definition_1');
    expect(editor.issues.some((issue) => issue.message.includes('Invalid registry ID'))).toBe(false);
  });

  it('protects reserved native portal slots and tombstones native graph removals', () => {
    editor.importSource(
      '<worldMapPreset version="1" id="custom:test" name="Test"><portals><portal id="lod:wmap_portal_0" legacyIndex="0"/></portals><nodes><node id="lod:wmap_node_0"><position x="0" y="0" z="0"/></node></nodes></worldMapPreset>',
      'test.wmap'
    );
    editor.select(editor.doc.querySelector('portal'), 'portals');
    editor.deleteSelected();
    expect(editor.doc.querySelector('portal')).not.toBeNull();
    editor.select(editor.doc.querySelector('node'), 'nodes');
    editor.deleteSelected();
    expect(editor.doc.querySelector('nodes node')).toBeNull();
    expect(editor.doc.querySelector('removals remove')?.getAttribute('id')).toBe('lod:wmap_node_0');
    editor.undo();
    expect(editor.doc.querySelector('nodes node')).not.toBeNull();
  });
  it('navigates entity history and clears forward history on a new hop', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test" name="Test"><nodes><node id="custom:a"/><node id="custom:b"/><node id="custom:c"/></nodes></worldMapPreset>', 'test.wmap');
    const [a, b, c] = Array.from(editor.doc.querySelectorAll('node'));
    editor.select(a, 'nodes');
    editor.goToEntry({ element: b, section: 'nodes' });
    editor.navigateEntity(false);
    expect(editor.selected).toBe(a);
    editor.navigateEntity(true);
    expect(editor.selected).toBe(b);
    editor.navigateEntity(false);
    editor.select(c, 'nodes');
    expect(editor.canNavigateEntity(true)).toBe(false);
    a.remove();
    expect(editor.canNavigateEntity(false)).toBe(false);
  });
  it('indexes reverse references for geometry and service definitions', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><geometry><geometry id="custom:shared"><points><item x="0" y="0" z="0"/><item x="1" y="0" z="0"/></points></geometry></geometry><routes><route id="custom:route" geometry="custom:shared"/></routes><serviceDefinitions><serviceDefinition id="custom:shared" label="Shop"/></serviceDefinitions><places><place id="custom:place"><serviceIds><item id="custom:shared"/><item id="custom:shared"/></serviceIds></place></places></worldMapPreset>', 'test.wmap');
    editor.select(editor.doc.querySelector('geometry[id]'), 'geometry');
    expect(editor.selectedReferences.map((reference) => reference.element.getAttribute('id'))).toEqual(['custom:route']);
    editor.select(editor.doc.querySelector('serviceDefinition'), 'serviceDefinitions');
    expect(editor.selectedReferences.length).toBe(1);
    expect(editor.selectedReferences[0].fields).toEqual(['serviceIds.id']);
    editor.goToEntry(editor.selectedReferences[0]);
    expect(editor.selected.getAttribute('id')).toBe('custom:place');
  });
  it('filters story references without hiding other referencing entities', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><portals><portal id="custom:p"/></portals><storyPresets><storyPreset id="custom:s"><enabledPortals><item id="custom:p"/></enabledPortals></storyPreset></storyPresets><coolonDestinations><coolonDestination id="custom:c" portal="custom:p"/></coolonDestinations></worldMapPreset>', 'test.wmap');
    editor.select(editor.doc.querySelector('portal'), 'portals');
    editor.includeStoryRefs = false;
    expect(editor.selectedReferences.map((ref) => ref.section)).toEqual(['coolonDestinations']);
    editor.includeStoryRefs = true;
    expect(editor.selectedReferences.map((ref) => ref.section)).toContain('storyPresets');
  });
  it('follows portal regions for entity selection and restores shared entity history regions', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:a"/><region id="custom:b"/></regions><nodes><node id="custom:n"/></nodes><routes><route id="custom:r" start="custom:n"/></routes><places><place id="custom:p"/></places><portals><portal id="custom:pa" region="custom:a" route="custom:r" place="custom:p"/><portal id="custom:pb" region="custom:b" route="custom:r"/></portals><coolonDestinations><coolonDestination id="custom:c" portal="custom:pb"/></coolonDestinations></worldMapPreset>', 'test.wmap');
    editor.region = 'custom:a';
    editor.select(editor.doc.querySelector('node'), 'nodes');
    expect(editor.region).toBe('custom:a');
    editor.goToEntry({ element: editor.doc.querySelector('coolonDestination'), section: 'coolonDestinations' });
    expect(editor.region).toBe('custom:b');
    editor.navigateEntity(false);
    expect(editor.selected.tagName).toBe('node');
    expect(editor.region).toBe('custom:a');
    editor.navigateEntity(true);
    expect(editor.region).toBe('custom:b');
    editor.select(editor.doc.querySelector('place'), 'places');
    expect(editor.region).toBe('custom:a');
  });
  it('shows Coolon markers in a region when its portal uses a native continent', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:a" legacyTemplate="0"/><region id="custom:b" legacyTemplate="1"/></regions><nodes><node id="custom:n"><position x="12" y="0" z="34"/></node></nodes><routes><route id="custom:r" start="custom:n" end="custom:n"/></routes><portals><portal id="custom:p" continent="0" route="custom:r"/></portals><coolonDestinations><coolonDestination id="custom:c" portal="custom:p"/></coolonDestinations></worldMapPreset>', 'test.wmap');
    editor.region = 'custom:a';
    expect(editor.coolonMarkers).toHaveLength(1);
    expect(editor.coolonMarkers[0]).toMatchObject({ x: 12, z: 34 });
    editor.region = 'custom:b';
    expect(editor.coolonMarkers).toHaveLength(0);
    editor.region = '';
    expect(editor.coolonMarkers).toHaveLength(1);
  });
  it('cycles shared geometry routes on map clicks but selects explicit links directly', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><routes><route id="custom:a" geometry="custom:g"/><route id="custom:b" geometry="custom:g"/><route id="custom:c" geometry="custom:g"/><route id="custom:d" geometry="custom:other"/></routes></worldMapPreset>', 'test.wmap');
    const [a, b, c, d] = Array.from(editor.doc.querySelectorAll('route'));
    editor.selectMapRoute(a);
    expect(editor.correspondingRoutes).toEqual([b, c]);
    editor.selectMapRoute(a);
    expect(editor.selected).toBe(b);
    editor.selectMapRoute(a);
    expect(editor.selected).toBe(c);
    editor.selectMapRoute(a);
    expect(editor.selected).toBe(a);
    editor.goToEntry({ element: c, section: 'routes' });
    expect(editor.selected).toBe(c);
    editor.selectMapRoute(d);
    expect(editor.selected).toBe(d);
    expect(editor.correspondingRoutes).toEqual([]);
  });
  it('creates an undoable counterpart with reversed terminals and copied settings', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><routes><route id="custom:route_1" legacyIndex="11" geometry="custom:g" start="custom:a" end="custom:b" direction="-1" encounterPool="custom:pool" encounterRate="2" modelIndex="1"/></routes></worldMapPreset>', 'test.wmap');
    editor.select(editor.doc.querySelector('route'), 'routes');
    editor.createCorrespondingRoute();
    const counterpart = editor.correspondingRoutes[0];
    expect(counterpart.getAttribute('id')).toBe('custom:route_2');
    expect(counterpart.hasAttribute('legacyIndex')).toBe(false);
    expect(counterpart.getAttribute('start')).toBe('custom:b');
    expect(counterpart.getAttribute('end')).toBe('custom:a');
    expect(counterpart.getAttribute('direction')).toBe('1');
    expect(counterpart.getAttribute('geometry')).toBe('custom:g');
    expect(counterpart.getAttribute('encounterPool')).toBe('custom:pool');
    expect(counterpart.getAttribute('encounterRate')).toBe('2');
    expect(counterpart.getAttribute('modelIndex')).toBe('1');
    editor.createCorrespondingRoute();
    expect(editor.correspondingRoutes).toHaveLength(1);
    editor.undo();
    expect(editor.correspondingRoutes).toHaveLength(0);
    editor.redo();
    expect(editor.correspondingRoutes).toHaveLength(1);
  });
  it('clears out-of-region geometry selection and restores it through history', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:a"/><region id="custom:b"/></regions><geometry><geometry id="custom:g"><points><item x="0" y="0" z="0"/><item x="1" y="0" z="1"/></points></geometry></geometry><routes><route id="custom:r" geometry="custom:g"/></routes><portals><portal id="custom:p" route="custom:r" region="custom:a"/></portals></worldMapPreset>', 'test.wmap');
    editor.select(editor.doc.querySelector('geometry[id]'), 'geometry');
    editor.changeRegion('');
    expect(editor.selected).not.toBeNull();
    editor.changeRegion('custom:a');
    expect(editor.selected).not.toBeNull();
    editor.changeRegion('custom:b');
    expect(editor.selected).toBeNull();
    expect(editor.handles).toHaveLength(0);
    editor.navigateEntity(false);
    expect(editor.selected.getAttribute('id')).toBe('custom:g');
    expect(editor.region).toBe('custom:a');
  });
  it('shows newly created unassigned nodes in a filtered region at the view center', () => {
    editor.importSource('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:a"/></regions></worldMapPreset>', 'test.wmap');
    editor.region = 'custom:a';
    editor.view = { x: 100, z: 200, width: 400, height: 200 };
    editor.chooseSection('nodes');
    editor.createEntry();
    expect(editor.filteredNodes).toHaveLength(1);
    expect(editor.filteredNodes[0]).toMatchObject({ x: 300, z: 300 });
  });
});
