import { CollisionSelection } from './asset-preview-types';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FORMAT_CATEGORIES, GAME_ASSET_CATEGORIES } from './asset-viewer-categories';
import { WORLD_MAP_THEME_COLORS } from '../world-map-editor/world-map-theme';
import { gunzipSync, strFromU8 } from 'fflate';
import { AssetCatalog, AssetRecord, identifyAsset, assetCategory, gameIdentity } from './asset-catalog';
import { AssetSource, AssetFileHandle, AssetDirectoryHandle, fileBytes } from './asset-source';
import { AssetPreviewComponent } from './asset-preview.component';
import { entityLinks, EntityLinkGroup } from './asset-entity-links';

@Component({
  selector: 'app-asset-viewer',
  imports: [FormsModule, DatePipe, AssetPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.viewport-host]': 'fillViewport', '[style.--wmap-hue-shift]': 'theme.shift', '[style]': 'themeColors' },
  templateUrl: './asset-viewer.component.html',
  styleUrls: ['../world-map-editor/world-map-editor.component.css', '../world-map-editor/world-map-viewport.css', './asset-viewer.component.css'],
})
export class AssetViewerComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly themes = [
    { name: 'Green', shift: 0, color: '#a4d77b' },
    { name: 'Purple', shift: 180, color: '#cb9de8' },
    { name: 'Red', shift: 250, color: '#ee9696' },
    { name: 'Orange', shift: 280, color: '#edb17c' },
    { name: 'Blue', shift: 110, color: '#91b8ef' },
  ];
  themeIndex = 0;
  fillViewport = true;
  headerCollapsed = false;
  controlsOpen = false;
  busy = false;
  error = '';
  search = '';
  catalog: AssetCatalog | null = null;
  companionAssets: AssetRecord[] = [];
  thumbnails = new Map<string, string>();
  private importedFiles = new Map<string, File>();
  private importedRecords: AssetRecord[] = [];
  rememberPreview(preview: { key: string; url: string }) {
    this.thumbnails.delete(preview.key);
    this.thumbnails.set(preview.key, preview.url);
    if (this.thumbnails.size > 256) this.thumbnails.delete(this.thumbnails.keys().next().value!);
    this.thumbnails = new Map(this.thumbnails);
    this.changeDetector.markForCheck();
  }
  catalogLoading = false;
  catalogError = '';
  source: AssetSource | null = null;
  selectedAsset: AssetRecord | null = null;
  private linkedEntity: AssetRecord | null = null;
  private linkedCatalog: AssetRecord[] | null = null;
  private cachedEntityLinks: EntityLinkGroup[] = [];
  get entityAttachments() {
    if (this.linkedEntity !== this.selectedAsset || this.linkedCatalog !== this.companionAssets) {
      this.linkedEntity = this.selectedAsset; this.linkedCatalog = this.companionAssets;
      this.cachedEntityLinks = this.selectedAsset ? entityLinks(this.selectedAsset, this.companionAssets) : [];
    }
    return this.cachedEntityLinks;
  }
  entityHistory: AssetRecord[] = [];
  historyIndex = -1;
  private rememberEntity(asset: AssetRecord) {
    if (this.historyIndex >= 0 && this.assetKey(this.entityHistory[this.historyIndex]) === this.assetKey(asset)) return;
    this.entityHistory = [...this.entityHistory.slice(0, this.historyIndex + 1), asset];
    this.historyIndex = this.entityHistory.length - 1;
  }
  async navigateHistory(direction: number) {
    const index = this.historyIndex + direction;
    if (this.busy || index < 0 || index >= this.entityHistory.length) return;
    if (await this.selectAsset(this.entityHistory[index], false)) {
      this.historyIndex = index;
      this.focusEntity(this.entityHistory[index]);
    }
    this.changeDetector.markForCheck();
  }
  async openEntity(asset: AssetRecord) {
    if (await this.selectAsset(asset)) this.focusEntity(asset);
    this.changeDetector.markForCheck();
  }
  private focusEntity(asset: AssetRecord) {
    if (this.browseMode === 'files') this.browseMode = 'format';
    this.categoryId = this.browseMode === 'game' ? asset.gameCategory : asset.category;
    this.search = ''; this.formatFilter = ''; this.gameFilter = '';
    const index = this.filteredAssets.findIndex(item => this.assetKey(item) === this.assetKey(asset));
    this.page = Math.max(0, Math.floor(index / this.pageSize));
  }
  selectedPolygon: CollisionSelection | null = null;
  get polygonDetails() { return Object.entries(this.selectedPolygon?.values || {}); }
  selectedBytes: Uint8Array = new Uint8Array();
  page = 0;
  formatFilter = '';
  gameFilter = '';
  private filterKey = '';
  private filtered: AssetRecord[] = [];
  private catalogReference: AssetCatalog | null = null;
  private relatedRecord: AssetRecord | null = null;
  private relatedCatalog: AssetCatalog | null = null;
  private relatedCache: AssetRecord[] = [];
  readonly pageSize = 80;
  readonly readAssetFile = async (path: string) => {
    const imported = this.importedFiles.get(path);
    if (imported) return fileBytes(imported);
    if (!this.source) throw new Error('Open your SC files folder to load related resources');
    return this.source.read(path);
  };
  async ngOnInit() { await this.loadCatalog(); }
  async loadCatalog() {
    this.catalogLoading = true; this.catalogError = '';
    try {
      const response = await fetch('assets/asset-viewer/catalog.json.gz');
      if (!response.ok) throw new Error('Asset catalog could not be loaded');
      const bytes = new Uint8Array(await response.arrayBuffer());
      // Some hosts serve .gz with Content-Encoding; fetch has already decompressed that response.
      const catalog = JSON.parse(strFromU8(bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes)) as AssetCatalog;
      if (catalog.version !== 1 || !Array.isArray(catalog.assets)) throw new Error('Unsupported asset catalog');
      this.catalog = catalog; this.companionAssets = [...catalog.assets, ...this.importedRecords];
    } catch { this.catalogError = 'The asset catalog could not be loaded. Retry or use File explorer.'; }
    finally { this.catalogLoading = false; this.changeDetector.markForCheck(); }
  }
  get filteredAssets() {
    const key = `${this.browseMode}|${this.categoryId}|${this.search}|${this.formatFilter}|${this.gameFilter}`;
    if (this.filterKey !== key || this.catalogReference !== this.catalog) {
      this.filterKey = key; this.catalogReference = this.catalog; this.page = 0;
      const query = this.search.toLowerCase();
      this.filtered = (this.catalog?.assets || []).filter(asset =>
        (this.browseMode === 'game' ? asset.gameCategory === this.categoryId : asset.category === this.categoryId) &&
        (!this.formatFilter || asset.format === this.formatFilter) && (!this.gameFilter || asset.gameAsset === this.gameFilter) &&
        (!query || `${asset.name} ${asset.path} ${asset.gameAsset} ${asset.format}`.toLowerCase().includes(query)));
    }
    return this.filtered;
  }
  get visibleAssets() { return this.filteredAssets.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }
  get totalPages() { return Math.ceil(this.filteredAssets.length / this.pageSize); }
  get availableFormats() { return [...new Set((this.catalog?.assets || []).filter(asset => (this.browseMode === 'game' ? asset.gameCategory === this.categoryId && (!this.gameFilter || asset.gameAsset === this.gameFilter) : asset.category === this.categoryId)).map(asset => asset.format))]; }
  get gameAssets() { return [...new Set((this.catalog?.assets || []).filter(asset => asset.gameCategory === this.categoryId).map(asset => asset.gameAsset))].sort(); }
  get relatedAssets() {
    if (!this.selectedAsset) return [];
    if (this.relatedRecord === this.selectedAsset && this.relatedCatalog === this.catalog) return this.relatedCache;
    this.relatedRecord = this.selectedAsset; this.relatedCatalog = this.catalog;
    const directory = this.selectedAsset.path.slice(0, this.selectedAsset.path.lastIndexOf('/'));
    this.relatedCache = (this.catalog?.assets || []).filter(asset => asset.path.slice(0, asset.path.lastIndexOf('/')) === directory && ['TMD', 'Animation', 'CMB', 'LMB'].includes(asset.format));
    return this.relatedCache;
  }
  assetKey(asset: AssetRecord) { return `${asset.path}@${asset.offset || 0}`; }
  async selectAsset(asset: AssetRecord, remember = true): Promise<boolean> {
    if (this.busy) return false;
    const imported = this.importedFiles.get(asset.path);
    if (!this.source && !imported) await this.connectFolder();
    if (!this.source && !imported) return false;
    this.busy = true; this.error = '';
    try {
      const file = imported || await this.source!.file(asset.path);
      const bytes = await fileBytes(file);
      this.selected = file; this.selectedPath = asset.path; this.selectedAsset = asset;
      this.selectedPolygon = null; this.selectedBytes = bytes.subarray(asset.offset || 0);
      if (remember) this.rememberEntity(asset);
      return true;
    } catch (error) { this.error = `Unable to load ${asset.path}. Check that the selected folder is SC's extracted files folder. ${error instanceof Error ? error.message : ''}`; return false; }
    finally { this.busy = false; this.changeDetector.markForCheck(); }
  }
  async importFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file || this.busy) return;
    this.busy = true; this.error = '';
    try {
      const bytes = await fileBytes(file);
      const format = identifyAsset(bytes, file.name);
      this.selected = file; this.selectedPath = file.name;
      this.selectedAsset = { path: file.name, name: file.name, format, category: assetCategory(format), ...gameIdentity(file.name), size: file.size };
      this.selectedPolygon = null; this.selectedBytes = bytes;
      this.importedFiles.set(file.name, file);
      this.importedRecords = [...this.importedRecords.filter(record => record.path !== file.name), this.selectedAsset!];
      this.companionAssets = [...(this.catalog?.assets || []), ...this.importedRecords];
      this.rememberEntity(this.selectedAsset);
    } catch (error) { this.error = String(error); }
    finally { this.busy = false; this.changeDetector.markForCheck(); }
  }
  browseMode: 'format' | 'game' | 'files' = 'format';
  categoryId = FORMAT_CATEGORIES[0].id;
  catalogSelection: { name: string; description: string } | null = null;
  get categories() { return this.browseMode === 'game' ? GAME_ASSET_CATEGORIES : FORMAT_CATEGORIES; }
  get category() { return this.categories.find(category => category.id === this.categoryId) || this.categories[0]; }
  get visibleCatalogEntries() { return this.category.entries.filter(entry => `${entry.name} ${entry.description}`.toLowerCase().includes(this.search.toLowerCase())); }

  setBrowseMode(mode: 'format' | 'game' | 'files') {
    this.browseMode = mode;
    this.categoryId = this.categories[0].id;
    this.catalogSelection = null;
    this.search = '';
    this.formatFilter = ''; this.gameFilter = ''; this.page = 0;
  }

  chooseCategory(id: string) {
    this.categoryId = id;
    this.catalogSelection = null;
    this.search = '';
    this.formatFilter = ''; this.gameFilter = ''; this.page = 0;
  }
  directories: AssetDirectoryHandle[] = [];
  entries: (AssetDirectoryHandle | AssetFileHandle)[] = [];
  selected: File | null = null;
  selectedPath = '';
  readonly supportsFolders = 'showDirectoryPicker' in window;

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem('lodtools.asset-viewer.preferences') || 'null');
      if (saved) {
        this.themeIndex = Math.max(0, this.themes.findIndex(theme => theme.name === saved.theme));
        this.fillViewport = saved.fillViewport !== false;
        this.headerCollapsed = saved.headerCollapsed === true;
      }
    } catch { /* Defaults remain available when browser storage is unavailable. */ }
  }

  get theme() { return this.themes[this.themeIndex]; }
  get path() { return this.directories.map(directory => directory.name).join('/'); }
  get visibleEntries() { return this.entries.filter(entry => entry.name.toLowerCase().includes(this.search.toLowerCase())); }

  savePreferences() {
    try {
      localStorage.setItem('lodtools.asset-viewer.preferences', JSON.stringify({ theme: this.theme.name, fillViewport: this.fillViewport, headerCollapsed: this.headerCollapsed }));
    } catch { /* Controls still work without browser storage. */ }
  }

  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % this.themes.length;
    this.savePreferences();
  }

  @HostListener('document:keydown.escape')
  dismissControls() { this.controlsOpen = false; }

  async connectFolder() {
    if (this.busy || !this.supportsFolders) return;
    this.busy = true;
    this.error = '';
    try {
      const picker = window as unknown as { showDirectoryPicker(options: { mode: 'read' }): Promise<AssetDirectoryHandle> };
      const directory = await picker.showDirectoryPicker({ mode: 'read' });
      await this.readDirectory([directory]);
      this.source = new AssetSource(directory);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) this.error = 'Unable to open the folder. Check folder access and try again.';
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  private async readDirectory(directories: AssetDirectoryHandle[]) {
    const entries: (AssetDirectoryHandle | AssetFileHandle)[] = [];
    for await (const entry of directories[directories.length - 1].values()) entries.push(entry);
    entries.sort((a, b) => Number(b.kind === 'directory') - Number(a.kind === 'directory') || a.name.localeCompare(b.name, undefined, { numeric: true }));
    this.directories = directories;
    this.entries = entries;
    this.search = '';
    this.selected = null;
    this.selectedPath = '';
    this.selectedAsset = null; this.selectedPolygon = null; this.selectedBytes = new Uint8Array();
  }

  async open(entry: AssetDirectoryHandle | AssetFileHandle) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      if (entry.kind === 'directory') await this.readDirectory([...this.directories, entry]);
      else {
        const file = await entry.getFile();
        const bytes = await fileBytes(file);
        const relativePath = [...this.directories.slice(1).map(directory => directory.name), entry.name].join('/');
        const format = identifyAsset(bytes, relativePath);
        this.selected = file;
        this.selectedPath = relativePath;
        this.selectedAsset = this.catalog?.assets.find(asset => asset.path === relativePath) || { path: relativePath, name: file.name, format, category: assetCategory(format), ...gameIdentity(relativePath), size: file.size };
        this.selectedPolygon = null; this.selectedBytes = bytes.subarray(this.selectedAsset.offset || 0);
        this.rememberEntity(this.selectedAsset);
      }
    } catch {
      this.error = 'Unable to open this entry. It may have moved or folder access may have expired.';
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  async navigate(depth: number) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try { await this.readDirectory(this.directories.slice(0, depth + 1)); }
    catch { this.error = 'Unable to read this folder. Reopen your files folder to restore access.'; }
    finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }
}
