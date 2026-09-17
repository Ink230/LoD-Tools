import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

@Component({
  selector: 'app-world-map-config',
  template: `<button type="button" (click)="open = !open" [class.active]="open" [attr.aria-expanded]="open">Config</button>
    @if (open) {
      <div class="popup">
        <label for="wmap-namespace">Registry namespace</label>
        <input id="wmap-namespace" [value]="namespace" pattern="[A-Za-z]+" required (input)="update($event)" title="Letters only; saved as lowercase" />
        <small>New IDs: {{ namespace }}:entry</small>
      </div>
    }`,
  styles: `:host{position:relative;display:inline-flex}button,input{font:inherit;color:var(--wmap-color-2);background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:4px;padding:7px 10px}button{cursor:pointer}.active{outline:1px solid currentColor}.popup{position:absolute;top:calc(100% + 6px);left:0;z-index:30;width:230px;box-sizing:border-box;padding:12px;display:grid;gap:8px;background:var(--wmap-color-4);border:1px solid var(--wmap-color-3);border-radius:5px}input{width:100%;box-sizing:border-box}small{font-size:11px}`
})
export class WorldMapConfigComponent {
  @Input() namespace = 'custom';
  @Output() namespaceChange = new EventEmitter<string>();
  private host = inject(ElementRef<HTMLElement>);
  open = false;
  update(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.checkValidity()) return;
    this.namespaceChange.emit(input.value.toLowerCase());
  }
  @HostListener('document:pointerdown', ['$event'])
  outside(event: PointerEvent) {
    if (!this.host.nativeElement.isConnected) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = false;
  }
  @HostListener('document:keydown.escape')
  close() { if (this.host.nativeElement.isConnected) this.open = false; }
}
