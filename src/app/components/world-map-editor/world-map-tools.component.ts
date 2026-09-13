import { Component, Input } from '@angular/core';
import type { WorldMapEditorComponent } from './world-map-editor.component';

@Component({
  selector: 'app-world-map-tools',
  template: `@if (editor.toolsOpen) {
    <div class="tools" [style.left]="'clamp(0px, ' + x + 'px, calc(100% - 42px))'" [style.top]="'clamp(0px, ' + y + 'px, calc(100% - 80px))'" (pointerdown)="$event.stopPropagation()">
      <button class="handle" title="Move tools" aria-label="Move tools" (pointerdown)="begin($event)" (pointermove)="move($event)" (pointerup)="end()" (pointercancel)="end()">⠿</button>
      <button title="Junction: split a corresponding route pair" aria-label="Junction tool" [class.active]="editor.mode === 'junction'" [attr.aria-pressed]="editor.mode === 'junction'" (click)="editor.mode = editor.mode === 'junction' ? 'select' : 'junction'">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18L12 9L21 18M12 9V2"/><circle cx="12" cy="9" r="3"/></svg>
      </button>
    </div>
  }`,
  styles: `:host{position:absolute;inset:0;pointer-events:none;z-index:5}.tools{position:absolute;display:flex;flex-direction:column;gap:4px;padding:3px;background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:5px;pointer-events:auto}button{display:grid;place-items:center;width:34px;height:34px;padding:5px;border:1px solid var(--wmap-color-3);border-radius:4px;background:var(--wmap-color-4);color:var(--wmap-color-2);cursor:pointer}.handle{touch-action:none;cursor:move}.active{outline:1px solid currentColor}svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}`
})
export class WorldMapToolsComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
  x = 12;
  y = 12;
  private drag?: { x: number; y: number; left: number; top: number; width: number; height: number };
  constructor() {
    try {
      const stored = JSON.parse(localStorage.getItem('lodtools.world-map.tools-position') || 'null');
      if (Number.isFinite(stored?.x) && Number.isFinite(stored?.y)) {
        this.x = Math.max(0, stored.x);
        this.y = Math.max(0, stored.y);
      }
    } catch { /* Default position remains usable. */ }
  }
  begin(event: PointerEvent) {
    if (event.button !== 0) return;
    const button = event.currentTarget as HTMLElement;
    const stage = button.parentElement.parentElement.getBoundingClientRect();
    this.drag = { x: event.clientX, y: event.clientY, left: this.x, top: this.y, width: stage.width, height: stage.height };
    button.setPointerCapture(event.pointerId);
  }
  move(event: PointerEvent) {
    if (!this.drag) return;
    this.x = Math.max(0, Math.min(this.drag.width - 42, this.drag.left + event.clientX - this.drag.x));
    this.y = Math.max(0, Math.min(this.drag.height - 80, this.drag.top + event.clientY - this.drag.y));
  }
  end() {
    this.drag = undefined;
    try { localStorage.setItem('lodtools.world-map.tools-position', JSON.stringify({ x: this.x, y: this.y })); } catch { /* Dragging works without storage. */ }
  }
}
