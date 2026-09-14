import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit } from '@angular/core';
import type { WorldMapEditorComponent } from './world-map-editor.component';
import { entries } from './world-map-document';
export const SEARCH_PREFIXES: Record<string, string> = { nodes: 'n', geometry: 'g', routes: 'rt', places: 'pl', portals: 'p', coolonDestinations: 'c', regions: 'region', teleportLinks: 'tl', storyPresets: 'sp', behaviours: 'bh', rules: 'rules', traversalProfiles: 'tp', presentationProfiles: 'pp', avatars: 'av', thumbnails: 'th', thumbnailDefinitions: 'td', battleStageDefinitions: 'bs', encounterPools: 'ep', soundDefinitions: 'snd', serviceDefinitions: 'svc', submapDestinations: 'sm', requiredMods: 'mods', removals: 'rm' };
@Component({
  selector: 'app-world-map-command',
  template: `<dialog #dialog (cancel)="$event.preventDefault(); escape()" (keydown)="keys($event)">
    <div class="heading"><strong>Search world map</strong><button (click)="dismiss.emit()">Close</button></div>
    <input #search aria-label="Search all world map entities" placeholder="Search everything, n: nodes, r: current region…" (input)="update(search.value)" />
    <div class="prefixes">@for (section of editor.sections; track section) { <button type="button" (click)="applyPrefix(prefixes[section])">{{ prefixes[section] }}: {{ editor.label(section) }}</button> }<button type="button" (click)="applyPrefix('r')">r: or &gt; Current region</button></div>
    <div class="results" role="listbox" aria-label="Search results">@for (result of results; track result.element; let i = $index) {
      <button role="option" [attr.aria-selected]="index === i" [class.active]="index === i" (click)="open(result)">{{ editor.label(result.section) }} · {{ result.element.getAttribute('name') || result.element.getAttribute('label') || result.element.getAttribute('id') || 'Rules' }} <small>{{ result.element.getAttribute('id') }}</small></button>
    } @empty { <p>No matching entities</p> }</div>
  </dialog>`,
  styles: `dialog{position:fixed;top:10vh;left:20vw;margin:0;width:60vw;height:70vh;box-sizing:border-box;background:var(--wmap-color-4);color:var(--wmap-color-2);border:1px solid var(--wmap-color-3);border-radius:8px;padding:16px}dialog::backdrop{background:#0006}.heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}input{width:100%;box-sizing:border-box;padding:10px;background:transparent;color:inherit;border:1px solid var(--wmap-color-3)}button{background:transparent;color:inherit;border:1px solid var(--wmap-color-3);padding:7px;cursor:pointer}.prefixes{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:11px;padding:12px 0;color:var(--wmap-color-47)}.prefixes button{font:inherit;border-radius:4px;padding:4px 6px}.prefixes button:hover,.prefixes button:focus-visible{background:var(--wmap-color-42);border-color:currentColor}.results{overflow:auto;max-height:65%;display:grid;gap:4px}.results button{text-align:left}.active{background:var(--wmap-color-42)}small{display:block}`
})
export class WorldMapCommandComponent implements AfterViewInit, OnInit {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
  @Output() dismiss = new EventEmitter<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('search') search!: ElementRef<HTMLInputElement>;
  prefixes = SEARCH_PREFIXES;
  results: { element: Element; section: string }[] = [];
  index = 0;
  ngOnInit() { this.update(''); }
  ngAfterViewInit() { this.dialog.nativeElement.showModal(); this.search.nativeElement.focus(); }
  escape() {
    const input = this.search.nativeElement;
    if (input.value.length) {
      input.value = '';
      this.update('');
      input.focus();
      return;
    }
    this.dismiss.emit();
  }
  applyPrefix(prefix: string) {
    const input = this.search.nativeElement;
    const query = input.value.trimStart().replace(/^(?:[a-z]+:\s*|>\s*)/i, '');
    input.value = prefix + ': ' + query;
    this.update(input.value);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  update(value: string) {
    let query = value.trim().toLowerCase();
    let section: string | undefined;
    let regional = false;
    const prefix = query.match(/^([a-z]+):\s*/);
    if (query.startsWith('>')) { regional = true; query = query.slice(1).trim(); }
    else if (prefix) { regional = prefix[1] === 'r'; section = Object.keys(this.prefixes).find(key => this.prefixes[key] === prefix[1]); query = query.slice(prefix[0].length); if (!regional && !section) { this.results = []; return; } }
    this.results = (section ? [section] : this.editor.sections).flatMap(section => entries(this.editor.doc, section).filter(element => (!regional || !this.editor.region || this.editor.entityInRegion(element, section, this.editor.region)) && `${element.getAttribute('id')} ${element.getAttribute('name')} ${element.getAttribute('label')}`.toLowerCase().includes(query)).map(element => ({ element, section }))).sort((a, b) => (a.element.getAttribute('id') || '').localeCompare(b.element.getAttribute('id') || '', undefined, { numeric: true })).slice(0, 200);
    this.index = 0;
  }
  keys(event: KeyboardEvent) {
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.dismiss.emit();
      return;
    }
    if (event.target !== this.search.nativeElement) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); this.index = Math.max(0, Math.min(this.results.length - 1, this.index + (event.key === 'ArrowDown' ? 1 : -1))); queueMicrotask(() => this.dialog.nativeElement.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })); }
    if (event.key === 'Enter' && this.results[this.index]) { event.preventDefault(); this.open(this.results[this.index]); }
  }
  open(result: { element: Element; section: string }) { this.editor.goToEntry(result); this.dismiss.emit(); }
}
