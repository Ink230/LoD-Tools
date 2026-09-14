import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { WorldMapEditorComponent } from './world-map-editor.component';

@Component({
  selector: 'app-world-map-tools',
  // Editor state is mutated in place, matching the canvas and inspector.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  template: `@if (editor.toolsOpen) {
    <div class="tools" [style.left]="'clamp(0px, ' + x + 'px, calc(100% - 52px))'" [style.top]="'clamp(0px, ' + y + 'px, calc(100% - 309px))'" (pointerdown)="$event.stopPropagation()">
      <button class="handle" [title]="pinned ? 'Unpin tools' : 'Drag to move; click to pin'" aria-label="Pin tools" [attr.aria-pressed]="pinned" [class.pinned]="pinned" (click)="togglePinned()" (pointerdown)="begin($event)" (pointermove)="move($event)" (pointerup)="end()" (pointercancel)="end()"><svg viewBox="0 0 12 5" aria-hidden="true"><circle cx="2" cy="1" r="1"/><circle cx="6" cy="1" r="1"/><circle cx="10" cy="1" r="1"/><circle cx="2" cy="4" r="1"/><circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/></svg></button>
      <button class="group-start" title="Select" aria-label="Select" [class.active]="editor.mode === 'select'" (click)="editor.finishGeometryDrawing(); editor.mode = 'select'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3L19 13L12 14L9 21Z"/></svg></button>
      <button title="Place node" aria-label="Place node" [class.active]="editor.mode === 'node'" (click)="editor.finishGeometryDrawing(); editor.mode = 'node'"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 8V16M8 12H16"/></svg></button>
      <button title="Draw geometry" aria-label="Draw geometry" [class.active]="editor.mode === 'drawGeometry'" [attr.aria-pressed]="editor.mode === 'drawGeometry'" (click)="editor.startGeometryDrawing()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18L10 7L20 14"/><rect x="2" y="16" width="4" height="4"/><rect x="8" y="5" width="4" height="4"/><rect x="18" y="12" width="4" height="4"/></svg></button>
      <button class="group-start" title="Junction: split a corresponding route pair" aria-label="Junction tool" [class.active]="editor.mode === 'junction'" [attr.aria-pressed]="editor.mode === 'junction'" (click)="editor.toggleJunctionTool()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18L12 9L21 18M12 9V2"/><circle cx="12" cy="9" r="3"/></svg>
      </button>
      <button title="Create Coolon destination" aria-label="Create Coolon destination" [class.active]="editor.mode === 'coolon'" [attr.aria-pressed]="editor.mode === 'coolon'" (click)="editor.toggleCoolonTool()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V7M12 12L3 5L5 14L12 17L19 14L21 5Z"/><circle cx="12" cy="5" r="2"/></svg></button>
      <button class="group-start" title="Portal view" aria-label="Portal view" [class.active]="editor.mode === 'portalView'" [attr.aria-pressed]="editor.mode === 'portalView'" (click)="editor.togglePortalView()"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="editor.portalIcon"/></svg></button>
      <button title="Places view" aria-label="Places view" [class.active]="editor.mode === 'placeView'" [attr.aria-pressed]="editor.mode === 'placeView'" (click)="editor.togglePlaceView()"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="editor.placeIcon"/></svg></button>
    </div>
  }`,
  styles: `:host{position:absolute;inset:0;pointer-events:none;z-index:5}.tools{position:absolute;display:flex;flex-direction:column;gap:4px;padding:3px 8px;background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:5px;pointer-events:auto}button{box-sizing:border-box;display:grid;place-items:center;width:34px;height:34px;padding:5px;border:1px solid var(--wmap-color-3);border-radius:4px;background:var(--wmap-color-4);color:var(--wmap-color-2);cursor:pointer}.handle{touch-action:none;cursor:move;height:11px;padding:2px 6px;line-height:1}.handle svg{width:12px;height:5px;fill:currentColor;stroke:none}.handle.pinned{cursor:pointer}.group-start{margin-top:8px}.active{outline:1px solid currentColor}svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}`
})
export class WorldMapToolsComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
  pinned = false;
  private moved = false;
  x = 12;
  y = 12;
  private drag?: { x: number; y: number; left: number; top: number; width: number; height: number };
  constructor() {
    try {
      this.pinned = localStorage.getItem('lodtools.world-map.tools-pinned') === 'true';
      const stored = JSON.parse(localStorage.getItem('lodtools.world-map.tools-position') || 'null');
      if (Number.isFinite(stored?.x) && Number.isFinite(stored?.y)) {
        this.x = Math.max(0, stored.x);
        this.y = Math.max(0, stored.y);
      }
    } catch { /* Default position remains usable. */ }
  }
  begin(event: PointerEvent) {
    this.moved = false;
    if (event.button !== 0 || this.pinned) return;
    const button = event.currentTarget as HTMLElement;
    const stage = button.parentElement.parentElement.getBoundingClientRect();
    this.drag = { x: event.clientX, y: event.clientY, left: this.x, top: this.y, width: stage.width, height: stage.height };
    button.setPointerCapture(event.pointerId);
  }
  move(event: PointerEvent) {
    if (!this.drag) return;
    if (Math.hypot(event.clientX - this.drag.x, event.clientY - this.drag.y) > 3) this.moved = true;
    if (!this.moved) return;
    this.x = Math.max(0, Math.min(this.drag.width - 52, this.drag.left + event.clientX - this.drag.x));
    this.y = Math.max(0, Math.min(this.drag.height - 309, this.drag.top + event.clientY - this.drag.y));
  }
  togglePinned() {
    if (this.moved) { this.moved = false; return; }
    this.pinned = !this.pinned;
    try { localStorage.setItem('lodtools.world-map.tools-pinned', String(this.pinned)); } catch { /* Pinning works without storage. */ }
  }
  end() {
    this.drag = undefined;
    try { localStorage.setItem('lodtools.world-map.tools-position', JSON.stringify({ x: this.x, y: this.y })); } catch { /* Dragging works without storage. */ }
  }
}
