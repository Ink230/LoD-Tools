import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AssetPreviewComponent } from './asset-preview.component';

 describe('collision selection', () => {
  it('selects a projected polygon, emits its associated info and clears on an empty click', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.sceneView = 'both';
    preview.submap = { width: 20, height: 20, originX: 0, originY: 0, layers: [], warnings: [] };
    preview.overlay = {
      format: 'Collision', warnings: [],
      camera: { position: [0, 0, 0], target: [0, 0, 100], projectionDistance: 100, rotation: 0 },
      polygons: [{ label: 'Collision primitive 0', points: [[0, 0, 100], [10, 0, 100], [10, 10, 100], [0, 10, 100]] }],
      records: [{ label: 'Collision primitive info 0', values: { planeConstant: 123, vertexCount: 4 } }],
    };
    const canvas = document.createElement('canvas');
    canvas.width = 20; canvas.height = 20;
    canvas.getBoundingClientRect = () => ({ left: -5, top: -5, width: 20, height: 20 } as DOMRect);
    preview.canvas = new ElementRef(canvas);
    let selection: unknown;
    preview.polygonSelected.subscribe(value => selection = value);
    const click = { clientX: 0, clientY: 0, target: canvas } as unknown as MouseEvent;
    preview.pickComposition(click);
    expect(selection).toMatchObject({ index: 0, values: { planeConstant: 123, vertexCount: 4 } });
    expect(preview.selectedPolygon).toBe(0);
    // Dragging must retain the selection rather than interpret the release as a click.
    preview.pickComposition({ ...click, clientX: 100 });
    expect(preview.selectedPolygon).toBe(0);
    canvas.getBoundingClientRect = () => ({ left: -15, top: -15, width: 20, height: 20 } as DOMRect);
    preview.pickComposition(click);
    expect(selection).toBeNull();
    fixture.destroy();
  });
});
