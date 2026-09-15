import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { WORLD_MAP_THEME_COLORS } from '../world-map-editor/world-map-theme';

interface AssetFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

interface AssetDirectoryHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterable<AssetDirectoryHandle | AssetFileHandle>;
}

@Component({
  selector: 'app-asset-viewer',
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.viewport-host]': 'fillViewport', '[style.--wmap-hue-shift]': 'theme.shift', '[style]': 'themeColors' },
  templateUrl: './asset-viewer.component.html',
  styleUrls: ['../world-map-editor/world-map-editor.component.css', '../world-map-editor/world-map-viewport.css', './asset-viewer.component.css'],
})
export class AssetViewerComponent {
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
  }

  async open(entry: AssetDirectoryHandle | AssetFileHandle) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      if (entry.kind === 'directory') await this.readDirectory([...this.directories, entry]);
      else {
        const file = await entry.getFile();
        this.selected = file;
        this.selectedPath = `${this.path}/${entry.name}`;
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
