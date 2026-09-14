import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { KEY_ACTIONS, KeyAction, keyboardChord, WorldMapKeybindings } from './world-map-keybindings';

@Component({
  selector: 'app-world-map-controls',
  template: `<dialog #dialog (cancel)="$event.preventDefault(); dismiss.emit()" (click)="outside($event)" (keydown)="capture($event)">
    <header><div><h2>Controls</h2><p>Click a key to rebind · Saved automatically</p></div><button class="reset" (click)="bindings.reset(); error = ''; recording = undefined">Reset defaults</button><button class="square" aria-label="Close controls" (click)="dismiss.emit()"><svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></header>
    @if (error) { <p class="error" role="alert">{{ error }}</p> }
    <div class="groups">@for (group of groups; track group.title) {
      <section><h3>{{ group.title }}</h3>@for (action of group.actions; track action.id) {
        <div class="binding-row"><span class="action" [title]="action.scope + ' shortcut'">{{ action.label }}</span><button class="binding" [class.recording]="recording === action.id" (click)="recording = action.id; error = ''" [attr.aria-label]="'Change ' + action.label">{{ recording === action.id ? 'Press keys…' : display(bindings.values[action.id]) }}</button><button class="square unbind" [disabled]="!bindings.values[action.id]" (click)="bindings.assign(action.id, ''); recording = undefined; error = ''" [title]="'Unbind ' + action.label" [attr.aria-label]="'Unbind ' + action.label"><svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div>
      }</section>
    }</div>
    <footer><p>Typing stays in form fields. Stage movement keys take priority on the map. Inspector navigation loops through controls. Ctrl also accepts Command on macOS.</p><details><summary>Mouse and standard controls</summary><dl><dt>Left click / drag</dt><dd>Select or use tool / move points or pan empty space</dd><dt>Middle drag / wheel</dt><dd>Pan / zoom at pointer</dd><dt>Ctrl + middle drag</dt><dd>Rotate; move inward for faster rotation</dd><dt>Ctrl + click / leave stage</dt><dd>Finish geometry</dd><dt>Compass / toolbar grip</dt><dd>Reset north / pin toolbar</dd><dt>Enter / Space</dt><dd>Activate focused button or marker</dd><dt>Escape in dialog</dt><dd>Close dialog</dd></dl></details></footer>
  </dialog>`,
  styles: `dialog{position:fixed;top:10vh;left:20vw;width:60vw;height:80vh;max-width:none;max-height:none;box-sizing:border-box;margin:0;padding:0;overflow:auto;background:var(--wmap-color-4);color:var(--wmap-color-2);border:1px solid var(--wmap-color-3);border-radius:8px;box-shadow:0 16px 60px #0009}dialog::backdrop{background:#0009}header{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--wmap-color-4);border-bottom:1px solid var(--wmap-color-3)}header>div{flex:1}h2{margin:0;font-size:20px}p{margin:4px 0 0;font-size:12px;line-height:1.4}button{font:inherit;color:inherit;background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:4px;cursor:pointer}button:hover:not(:disabled),button:focus-visible{border-color:var(--wmap-color-47);background:var(--wmap-color-42)}button:focus-visible{outline:2px solid var(--wmap-color-47);outline-offset:2px}.reset{padding:7px 10px;font-size:12px}.square{width:28px;height:28px;display:inline-grid;place-items:center;padding:6px;flex:none}.square svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5}.groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 22px;padding:12px 16px;align-items:start}section{min-width:0}h3{margin:0 0 4px;padding:0 0 5px;border-bottom:1px solid var(--wmap-color-3);font-size:13px;color:var(--wmap-color-47)}.binding-row{display:flex;align-items:center;gap:5px;min-height:34px;border-bottom:1px solid color-mix(in srgb,var(--wmap-color-3) 35%,transparent)}.action{flex:1;min-width:0;font-size:12px}.binding{min-width:104px;max-width:180px;min-height:27px;padding:3px 8px;font-family:monospace;font-size:12px;box-shadow:0 2px 0 #0005;background:color-mix(in srgb,var(--wmap-color-47) 10%,var(--wmap-color-4))}.recording{border-color:var(--wmap-color-47);color:var(--wmap-color-47)}.unbind{width:24px;height:24px;padding:4px}.unbind:disabled{opacity:.2;cursor:default}footer{padding:8px 16px 14px;border-top:1px solid var(--wmap-color-3)}summary{cursor:pointer;margin-top:8px;font-size:12px;color:var(--wmap-color-47)}dl{display:grid;grid-template-columns:180px 1fr;gap:5px;font-size:12px}dd{margin:0}.error{padding:8px 16px}`
})
export class WorldMapControlsComponent implements AfterViewInit {
  @Input({ required: true }) bindings!: WorldMapKeybindings;
  @Output() dismiss = new EventEmitter<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  groups = [
    { title: 'History and navigation', ids: 'undo redo back forward previousRegion nextRegion registrySearch command inspector focusStage inspectorNext inspectorPrevious cancel' },
    { title: 'Map and camera', ids: 'north east south west rotateLeft rotateRight fit zoomIn zoomOut coords labels labelConfig background' },
    { title: 'Tools and views', ids: 'tools pin select node geometry junction coolon portals places story map xml assets diagnostics config' },
    { title: 'Files and workspace', ids: 'vanilla save import export package controls viewport header theme' },
    { title: 'Stage movement', ids: 'up down left right fastUp fastDown fastLeft fastRight delete' }
  ].map(group => ({ title: group.title, actions: group.ids.split(' ').map(id => KEY_ACTIONS.find(action => action.id === id)!) }));
  recording?: KeyAction;
  error = '';
  display(value: string) { return value ? value.replace(/ $/, 'Space').replace('Shift+?', '?') : 'Unbound'; }
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
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.dismiss.emit();
  }
}
