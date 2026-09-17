import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { EditorRouteReuseStrategy } from './editor-route-reuse.strategy';

@Component({ template: '<input />' })
class EditorSession {
  state = { folder: {}, assets: ['model', 'texture'], undo: ['edit'] };
}

@Component({ template: 'Other page' })
class OtherPage {}

describe('editor navigation sessions', () => {
  it('reattaches both live editors and their DOM without retaining ordinary pages', async () => {
    TestBed.configureTestingModule({ providers: [
      provideRouter([
        { path: 'asset-viewer', component: EditorSession, data: { preserveEditorSession: true } },
        { path: 'world-map-editor', component: EditorSession, data: { preserveEditorSession: true } },
        { path: 'other', component: OtherPage },
      ]),
      { provide: RouteReuseStrategy, useClass: EditorRouteReuseStrategy },
    ] });
    const harness = await RouterTestingHarness.create();
    const assets = await harness.navigateByUrl('/asset-viewer', EditorSession);
    const state = assets.state;
    const input = harness.routeNativeElement!.querySelector('input')!;
    input.value = 'unsaved selection';
    const world = await harness.navigateByUrl('/world-map-editor', EditorSession);
    world.state.undo.push('second edit');
    const other = await harness.navigateByUrl('/other', OtherPage);
    expect(await harness.navigateByUrl('/asset-viewer', EditorSession)).toBe(assets);
    expect(assets.state).toBe(state);
    expect(harness.routeNativeElement!.querySelector('input')).toBe(input);
    expect(input.value).toBe('unsaved selection');
    expect(await harness.navigateByUrl('/world-map-editor', EditorSession)).toBe(world);
    expect(world.state.undo).toEqual(['edit', 'second edit']);
    expect(await harness.navigateByUrl('/other', OtherPage)).not.toBe(other);
  });
});
