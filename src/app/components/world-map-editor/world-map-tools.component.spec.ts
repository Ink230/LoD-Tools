import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { WorldMapToolsComponent } from './world-map-tools.component';
import type { WorldMapEditorComponent } from './world-map-editor.component';

describe('floating tools', () => {
  it('renders when the existing editor object toggles its open state', () => {
    TestBed.configureTestingModule({ imports: [WorldMapToolsComponent] });
    const fixture = TestBed.createComponent(WorldMapToolsComponent);
    const editor = { toolsOpen: false, mode: 'select' } as WorldMapEditorComponent;
    fixture.componentRef.setInput('editor', editor);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tools')).toBeNull();
    editor.toolsOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.tools button')).toHaveLength(13);
    editor.toolsOpen = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tools')).toBeNull();
  });
});
