import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { KEY_ACTIONS, KeyAction, keyboardChord, WorldMapKeybindings } from './world-map-keybindings';

@Component({
  selector: 'app-world-map-controls',
  template: `<dialog #dialog (cancel)="$event.preventDefault(); close.emit()" (click)="outside($event)" (keydown)="capture($event)">
    <header><h2>Controls</h2><button (click)="bindings.reset(); error = ''; recording = undefined">Reset defaults</button><button aria-label="Close controls" (click)="close.emit()">×</button></header>
    <p>Click a binding, then press its replacement. Changes are saved automatically. Ctrl also accepts Command on macOS. Stage shortcuts take priority while the map is focused.</p>
    @if (error) { <p role="alert">{{ error }}</p> }
    <table><thead><tr><th>Action</th><th>Scope</th><th>Binding</th><th></th></tr></thead><tbody>
      @for (action of actions; track action.id) {
        <tr><td>{{ action.label }}</td><td>{{ action.scope }}</td><td><button (click)="recording = action.id; error = ''" [attr.aria-label]="'Change ' + action.label">{{ recording === action.id ? 'Press keys…' : bindings.values[action.id] || 'Unassigned' }}</button></td><td><button (click)="bindings.assign(action.id, ''); recording = undefined" [attr.aria-label]="'Clear ' + action.label">Clear</button></td></tr>
      }
    </tbody></table>
    <h3>Mouse and standard controls</h3>
    <p>These gestures retain their standard behavior and are not remapped here.</p>
    <dl><dt>Left click</dt><dd>Select, place, or activate the current tool</dd><dt>Left drag</dt><dd>Move nodes/points; pan on empty map space; drag the toolbar grip</dd><dt>Middle drag</dt><dd>Pan the map</dd><dt>Ctrl + middle drag</dt><dd>Rotate the map; moving toward the center increases sensitivity</dd><dt>Wheel</dt><dd>Zoom around the pointer</dd><dt>Ctrl + left click</dt><dd>Finish geometry drawing</dd><dt>Click outside stage</dt><dd>Finish geometry drawing</dd><dt>Click compass</dt><dd>Reset north orientation</dd><dt>Click toolbar grip</dt><dd>Pin/unpin the toolbar</dd><dt>Enter / Space</dt><dd>Activate focused buttons and map markers</dd><dt>Tab / Shift+Tab</dt><dd>Move keyboard focus</dd><dt>Escape in a popup</dt><dd>Close that popup; this remains available independently of map bindings</dd></dl>
  </dialog>`,
  styles: `dialog{position:fixed;top:10vh;left:20vw;width:60vw;height:80vh;max-width:none;max-height:none;box-sizing:border-box;margin:0;padding:20px;overflow:auto;background:var(--wmap-color-4);color:var(--wmap-color-2);border:1px solid var(--wmap-color-3);border-radius:8px}dialog::backdrop{background:#0009}header{display:flex;align-items:center;gap:12px}h2{margin:0;flex:1}h3{color:var(--wmap-color-47)}button{font:inherit;color:inherit;background:transparent;border:1px solid var(--wmap-color-3);border-radius:4px;padding:6px 10px;cursor:pointer}button:focus-visible{outline:2px solid currentColor}table{width:100%;border-collapse:collapse;text-align:left}td,th{padding:7px;border-bottom:1px solid var(--wmap-color-3)}td:nth-child(3) button{min-width:150px}p,dd{font-size:13px;line-height:1.5}dl{display:grid;grid-template-columns:190px 1fr;gap:10px}dd{margin:0}`
})
export class WorldMapControlsComponent implements AfterViewInit {
  @Input({ required: true }) bindings!: WorldMapKeybindings;
  @Output() close = new EventEmitter<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  actions = KEY_ACTIONS;
  recording?: KeyAction;
  error = '';
  ngAfterViewInit() { this.dialog.nativeElement.showModal(); }
  capture(event: KeyboardEvent) {
    event.stopPropagation();
    if (!this.recording) return;
    event.preventDefault();
    const chord = keyboardChord(event);
    if (!chord) return;
    this.error = this.bindings.assign(this.recording, chord) || '';
    if (!this.error) this.recording = undefined;
  }
  outside(event: MouseEvent) {
    if (event.target !== this.dialog.nativeElement) return;
    const bounds = this.dialog.nativeElement.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.close.emit();
  }
}
