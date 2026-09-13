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
});
