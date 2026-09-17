import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetRecord } from './asset-catalog';
import { MODEL_BACKGROUND_FORMATS } from './asset-model-background';

export type CompanionKind = 'texture' | 'model' | 'animation';
export type AssetPickerKind = CompanionKind | 'background';
export function companionFormats(kind: AssetPickerKind): string[] {
  if (kind === 'background') return MODEL_BACKGROUND_FORMATS;
  return kind === 'texture' ? ['TIM'] : kind === 'model' ? ['TMD'] : ['Animation', 'CMB', 'LMB'];
}
export function companionResourceIncluded(asset: AssetRecord, includeGameResources: boolean, includeSubmapResources: boolean, includeFieldEffects = false): boolean {
  if (asset.path.startsWith('SUBMAP/')) return includeFieldEffects;
  if (/^SECT\/DRGN2[1-4]\.BIN\//.test(asset.path)) return includeSubmapResources;
  if (asset.path.startsWith('SECT/')) return includeGameResources;
  return true;
}

@Component({
  selector: 'app-asset-companion-picker',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section role="dialog" aria-modal="true" aria-labelledby="companion-title" (keydown.escape)="closed.emit(); $event.stopPropagation()">
      <header><h3 id="companion-title">Choose {{ kind === 'texture' ? 'textures' : kind }}</h3><button (click)="closed.emit()" aria-label="Close asset chooser">×</button></header>
      <input #searchInput aria-label="Search companion assets" placeholder="Search name or asset path…" [ngModel]="search" (ngModelChange)="search = $event; page = 0" />
      @if (kind === 'background') {
        <div class="filter-buttons" role="group" aria-label="Background asset categories">
          @for (group of backgroundGroups; track group.id) { <button (click)="backgroundGroup = group.id" [attr.aria-pressed]="backgroundGroup === group.id" [class.selected]="backgroundGroup === group.id">{{ group.label }}</button> }
        </div>
        <div class="filter-buttons" role="group" aria-label="Background file types">
          <button (click)="backgroundFormat = ''" [attr.aria-pressed]="backgroundFormat === ''" [class.selected]="backgroundFormat === ''">All types</button>
          @for (format of backgroundFormats; track format) { <button (click)="backgroundFormat = format" [attr.aria-pressed]="backgroundFormat === format" [class.selected]="backgroundFormat === format">{{ format }}</button> }
        </div>
      }
      @if (error) { <p role="alert">{{ error }}</p> }
      <div class="results">
        @for (asset of visible; track key(asset)) {
          <button class="asset" [class.selected]="selected.has(key(asset))" [attr.aria-pressed]="selected.has(key(asset))" (click)="toggle(asset)">
            @if (thumbnails.get(key(asset)); as thumbnail) { <img [src]="thumbnail" alt="Loaded asset preview" /> }
            @else { <span class="placeholder">{{ asset.format }}</span> }
            <span><strong>{{ asset.gameAsset }} / {{ asset.name }}</strong><small>{{ asset.path }}@if (asset.offset) { · offset {{ asset.offset }} }</small></span>
          </button>
        } @empty { <p>No compatible assets match your search.</p> }
      </div>
      <footer><button (click)="page = page - 1" [disabled]="page === 0">Previous</button><span>{{ page + 1 }} / {{ pages }}</span><button (click)="page = page + 1" [disabled]="page + 1 >= pages">Next</button><button (click)="selection()" [disabled]="!selected.size">Use selected ({{ selected.size }})</button></footer>
    </section>
  `,
  styles: [`
    :host{position:fixed;inset:0;z-index:1000;background:#000a;display:grid;place-items:center;padding:24px}
    section{width:min(850px,100%);max-height:85vh;display:flex;flex-direction:column;background:var(--wmap-color-4,#142019);color:var(--wmap-color-2,#d8e5d1);border:1px solid var(--wmap-color-3,#52764b);padding:16px;gap:12px;border-radius:6px}
    header,footer,.filter-buttons{display:flex;align-items:center;gap:12px}h3{flex:1;margin:0}button,input{font:inherit;color:inherit;background:transparent;border:1px solid var(--wmap-color-3,#52764b);padding:8px;border-radius:4px}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}.results{overflow:auto;min-height:120px}.asset{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-bottom:5px}.selected{background:var(--wmap-color-0,#35512b)}img,.placeholder{width:80px;height:60px;object-fit:contain;flex-shrink:0}.placeholder{display:grid;place-items:center;opacity:.6}small{display:block;overflow-wrap:anywhere;font-size:11px;opacity:.75}footer,.filter-buttons{flex-wrap:wrap}
  `],
})
export class AssetCompanionPickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  private previousFocus: HTMLElement | null = null;
  ngAfterViewInit() { this.previousFocus = document.activeElement as HTMLElement; this.searchInput?.nativeElement.focus(); }
  ngOnDestroy() { this.previousFocus?.focus(); }
  @Input() kind: AssetPickerKind = 'texture';
  @Input() assets: AssetRecord[] = [];
  @Input() thumbnails = new Map<string, string>();
  @Input() error = '';
  @Input() includeGameResources = false;
  @Input() includeSubmapResources = false;
  @Input() includeFieldEffects = false;
  @Output() picked = new EventEmitter<AssetRecord[]>();
  @Output() closed = new EventEmitter<void>();
  search = '';
  backgroundGroup = '';
  backgroundFormat = '';
  readonly backgroundGroups = [{ id: '', label: 'All assets' }, { id: 'backgrounds', label: 'Backgrounds' }, { id: 'battle-stages', label: 'Battle stages' }, { id: 'textures', label: 'Textures' }];
  readonly backgroundFormats = MODEL_BACKGROUND_FORMATS;
  private matchesBackgroundFilters(asset: AssetRecord) {
    if (this.kind !== 'background') return true;
    if (this.backgroundFormat && asset.format !== this.backgroundFormat) return false;
    if (this.backgroundGroup === 'battle-stages') return asset.battleStageId !== undefined;
    if (this.backgroundGroup === 'textures') return asset.format === 'TIM';
    if (this.backgroundGroup === 'backgrounds') return asset.battleStageId === undefined && asset.format !== 'TIM';
    return true;
  }
  page = 0;
  selected = new Map<string, AssetRecord>();
  private filterKey = '';
  private previousAssets?: AssetRecord[];
  private matches: AssetRecord[] = [];
  key(asset: AssetRecord) { return `${asset.path}@${asset.offset || 0}`; }
  get filtered() {
    const key = `${this.kind}:${this.search}:${this.includeGameResources}:${this.includeSubmapResources}:${this.includeFieldEffects}:${this.backgroundGroup}:${this.backgroundFormat}`;
    if (key !== this.filterKey || this.previousAssets !== this.assets) {
      const formats = companionFormats(this.kind);
      const query = this.search.toLowerCase();
      this.matches = this.assets.filter(asset => formats.includes(asset.format) && this.matchesBackgroundFilters(asset) && companionResourceIncluded(asset, this.includeGameResources, this.includeSubmapResources, this.includeFieldEffects) && `${asset.path} ${asset.name} ${asset.gameAsset}`.toLowerCase().includes(query));
      this.page = 0;
      this.filterKey = key;
      this.previousAssets = this.assets;
    }
    return this.matches;
  }
  get visible() { return this.filtered.slice(this.page * 60, (this.page + 1) * 60); }
  get pages() { return Math.max(1, Math.ceil(this.filtered.length / 60)); }
  selection() { this.picked.emit([...this.selected.values()]); }
  toggle(asset: AssetRecord) {
    const key = this.key(asset);
    if (this.selected.has(key)) this.selected.delete(key);
    else {
      if (this.kind !== 'texture') this.selected.clear();
      if (this.selected.size < 32) this.selected.set(key, asset);
    }
  }
}
