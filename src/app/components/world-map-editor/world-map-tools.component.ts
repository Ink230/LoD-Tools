import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { WorldMapEditorComponent } from './world-map-editor.component';

@Component({
  selector: 'app-world-map-tools',
  // Editor state is mutated in place, matching the canvas and inspector.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  template: `@if (editor.toolsOpen) {
    <div class="tools" [style.left]="'clamp(0px, ' + x + 'px, calc(100% - 52px))'" [style.top]="'clamp(0px, ' + y + 'px, calc(100% - 513px))'" (pointerdown)="$event.stopPropagation()">
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
      <button class="group-start" title="Toggle labels" aria-label="Toggle labels" [class.active]="editor.showLabels" [attr.aria-pressed]="editor.showLabels" (click)="editor.showLabels = !editor.showLabels; editor.saveLabelSettings()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12S6 5 12 5s10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
      <div style="position: relative">
        <button title="Configure labels" aria-label="Configure labels" [attr.aria-expanded]="editor.labelMenuOpen" (click)="toggleLabels($event)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h4v4H4ZM11 7h9M4 15h4v4H4ZM11 17h9"/></svg></button>
        @if (editor.labelMenuOpen) {
          <div class="label-flyout" [class.flyout-left]="labelsLeft">
            @for (kind of editor.labelKinds; track kind) {
              <button [title]="editor.label(kind)" [attr.aria-label]="'Toggle ' + editor.label(kind) + ' labels'" [class.active]="editor.activeLabels[kind]" [attr.aria-pressed]="editor.activeLabels[kind]" (click)="editor.activeLabels[kind] = !editor.activeLabels[kind]; editor.saveLabelSettings()"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="labelIcon(kind)"/></svg></button>
            }
          </div>
        }
      </div>
      <button title="Fit map" aria-label="Fit map" (click)="editor.fit()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6M8 8h8v8H8Z"/></svg></button>
      <button title="Zoom in" aria-label="Zoom in" (click)="editor.zoom(0.8)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
      <button title="Zoom out" aria-label="Zoom out" (click)="editor.zoom(1.25)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>
    </div>
  }`,
  styles: `:host{position:absolute;inset:0;pointer-events:none;z-index:5}.tools{position:absolute;display:flex;flex-direction:column;gap:4px;padding:3px 8px 9px;background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:5px;pointer-events:auto}button{box-sizing:border-box;display:grid;place-items:center;width:34px;height:34px;padding:5px;border:1px solid var(--wmap-color-3);border-radius:4px;background:var(--wmap-color-4);color:var(--wmap-color-2);cursor:pointer}.label-flyout{position:absolute;left:calc(100% + 12px);top:0;display:flex;gap:4px}.label-flyout.flyout-left{left:auto;right:calc(100% + 12px)}.handle{touch-action:none;cursor:move;height:11px;padding:2px 6px;line-height:1}.handle svg{width:12px;height:5px;fill:currentColor;stroke:none}.handle.pinned{cursor:pointer}.group-start{margin-top:8px}.active{outline:1px solid currentColor}.label-flyout button.active{background:var(--wmap-color-42);color:var(--wmap-color-43);border-color:var(--wmap-color-44)}svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}`
})
export class WorldMapToolsComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
  labelsLeft = false;
  toggleLabels(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    const host = button.closest('app-world-map-tools').getBoundingClientRect();
    this.labelsLeft = button.getBoundingClientRect().right + 240 > host.right;
    this.editor.labelMenuOpen = !this.editor.labelMenuOpen;
  }
  labelIcon(kind: string) {
    const icons: Record<string, string> = {
      places: this.editor.placeIcon, portals: this.editor.portalIcon,
      nodes: 'M19 12a7 7 0 1 1-14 0a7 7 0 0 1 14 0',
      routes: 'M3 18L9 6L15 18L21 6M16 6h5v5',
      geometry: 'M4 18L10 6L20 14M2 16h4v4H2ZM8 4h4v4H8ZM18 12h4v4h-4Z',
      coolonDestinations: 'M12 19V7M12 12L3 5L5 14L12 17L19 14L21 5Z',
    };
    return icons[kind];
  }
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
    this.y = Math.max(0, Math.min(this.drag.height - 513, this.drag.top + event.clientY - this.drag.y));
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
