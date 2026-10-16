import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { registerBrowserTools, toolInput, toolString } from '../../services/browser-agent';
import { StyledSelectComponent } from '../shared/styled-select/styled-select.component';
import { WORLD_MAP_THEME_COLORS } from '../world-map-editor/world-map-theme';
import { MOD_CATALOG, ModListing, ScCompatibility } from './mod-catalog';
import { createModBundle, modDownload } from './mod-download';
import { ModCardComponent } from './mod-card.component';
import { filterMods, modSection, ModSort } from './mod-collection-state';
import { ModReleasesService } from './mod-releases.service';

@Component({
  selector: 'app-mod-collection',
  host: { '[style]': 'themeColors' },
  imports: [StyledSelectComponent, ModCardComponent],
  templateUrl: './mod-collection.component.html',
  styleUrls: ['./mod-collection.component.css', './mod-download-controls.css', './mod-extraction-guide.css'],
})
export class ModCollectionComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly releases = inject(ModReleasesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private downloadController?: AbortController;
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly query = signal('');
  readonly version = signal('');
  readonly sort = signal<ModSort>('featured');
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly catalog = this.releases.catalog;
  readonly loadingFresh = this.releases.loading;
  readonly selectedMods = computed(() => this.catalog().filter(mod => this.selected().has(mod.id) && modDownload(mod)));
  readonly downloading = signal(false);
  readonly downloadStatus = signal('');
  readonly downloadError = signal('');
  readonly extractionImages = [
    { src: '/assets/mod-installation/step-01.jpg', alt: 'Move dragoonmods-mods.zip from Downloads into the Severed Chains mods folder', caption: 'Move the downloaded ZIP into SC/mods.' },
    { src: '/assets/mod-installation/step-02.jpg', alt: 'Right-click dragoonmods-mods.zip inside SC/mods and choose Extract All', caption: 'Right-click the ZIP and choose Extract All…' },
    { src: '/assets/mod-installation/step-03.jpg', alt: 'Incorrect extraction destination: SC/mods/dragoonmods-mods creates an unwanted extra folder', caption: 'Incorrect: do not extract into an extra dragoonmods-mods folder.' },
    { src: '/assets/mod-installation/step-04.jpg', alt: 'Correct extraction destination: the existing SC/mods folder, with no extra subfolder', caption: 'Correct: set the destination to SC/mods, then click Extract.' },
    { src: '/assets/mod-installation/step-05.jpg', alt: 'Finished installation with the mod JARs and companion folders directly inside SC/mods', caption: 'Finished: JARs and companion folders are directly inside SC/mods.' },
  ] as const;
  readonly extractionImageIndex = signal(0);
  readonly extractionImage = computed(() => this.extractionImages[this.extractionImageIndex()]);
  readonly modDownload = modDownload;
  readonly versions: readonly ScCompatibility[] = ['Latest SC', 'RB3', 'Special build', 'Check compatibility'];
  readonly versionOptions = [{ value: '', label: 'All versions' }, ...this.versions.map(value => ({ value, label: value }))];
  readonly sortOptions = [{ value: 'featured', label: 'Featured' }, { value: 'name', label: 'Name A–Z' }, { value: 'author', label: 'Author A–Z' }];
  readonly filtered = computed(() => filterMods(this.catalog(), this.query(), this.version(), this.sort()));
  readonly sections = computed(() => [
    { id: 'developer', title: 'SC Dev Made Mods' },
    { id: 'top-rated', title: 'Top Rated Community Mods' },
    { id: 'other', title: 'Other Mods' },
  ].map(section => ({
    ...section,
    mods: this.filtered().filter(mod => modSection(mod) === section.id),
    populated: this.catalog().some(mod => modSection(mod) === section.id),
  })));
  readonly tools = computed(() => this.filtered().filter(mod => mod.section === 'tools'));

  constructor() {
    this.destroyRef.onDestroy(() => this.downloadController?.abort());
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.query.set((params.get('q') || '').slice(0, 200));
      const version = params.get('version') || '';
      this.version.set(this.versions.includes(version as ScCompatibility) ? version : '');
      const sort = params.get('sort');
      this.sort.set(sort === 'name' || sort === 'author' ? sort : 'featured');
    });
    this.destroyRef.onDestroy(registerBrowserTools(inject(DOCUMENT), [
      {
        name: 'get_mod_selection', description: 'Read selected mod IDs, current releases, loading state and download state on the Mods page.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async input => {
          toolInput(input, []);
          return JSON.stringify(this.selectionState());
        },
      },
      {
        name: 'set_mod_filters', description: 'Visibly change Mods search, compatibility and sort, and update the shareable URL. Does not change selections.',
        inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 200 }, version: { type: 'string', enum: ['', ...this.versions] }, sort: { type: 'string', enum: ['featured', 'name', 'author'] } }, additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute: async input => {
          const args = toolInput(input, ['query', 'version', 'sort']);
          const query = toolString(args['query'], this.query());
          const version = toolString(args['version'], this.version());
          const sort = toolString(args['sort'], this.sort());
          if (version && !this.versions.includes(version as ScCompatibility)) throw new Error('Unknown compatibility filter');
          if (!['featured', 'name', 'author'].includes(sort)) throw new Error('Unknown sort');
          await this.setFilters({ query, version, sort: sort as ModSort });
          return JSON.stringify({ query: this.query(), version: this.version(), sort: this.sort(), count: this.filtered().length });
        },
      },
      {
        name: 'set_mod_selection', description: 'Replace selected mods with these IDs, or [] to clear. Requires finished release checks and matching ZIP cache. Does not download or install.',
        inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' }, maxItems: MOD_CATALOG.length, uniqueItems: true } }, required: ['ids'], additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute: async input => JSON.stringify(this.setAgentSelection(input)),
      },
    ]));
    effect(() => {
      if (this.downloading() || this.loadingFresh()) return;
      const eligible = new Set(this.catalog().filter(mod => modDownload(mod)).map(mod => mod.id));
      const selected = new Set([...this.selected()].filter(id => eligible.has(id)));
      if (selected.size !== this.selected().size) {
        this.selected.set(selected);
      }
    });
    void this.releases.refresh();
  }

  showExtractionImage(direction: number): void {
    this.extractionImageIndex.update(index => Math.max(0, Math.min(this.extractionImages.length - 1, index + direction)));
  }

  selectionTitle(mod: ModListing): string {
    if (modDownload(mod)) return `Include ${mod.name} v${mod.releases[0].version || 'unknown'} in the ZIP`;
    if (MOD_CATALOG.find(entry => entry.id === mod.id)?.releases[0]?.url && mod.section !== 'tools') return 'This release is not in the combined ZIP yet. Download it using its release link.';
    return mod.section === 'tools' ? 'Install standalone tools separately' : 'No downloadable release available yet';
  }

  selectMod(mod: ModListing, checked: boolean): void {
    if (this.downloading() || this.loadingFresh() || !modDownload(mod)) return;
    const selected = new Set(this.selected());
    if (checked) selected.add(mod.id);
    else selected.delete(mod.id);
    this.selected.set(selected);
    this.downloadStatus.set('');
    this.downloadError.set('');
  }

  clearSelections(): void {
    if (this.downloading()) return;
    this.selected.set(new Set());
    this.downloadStatus.set('');
    this.downloadError.set('');
  }

  async downloadMods(): Promise<void> {
    if (this.downloading() || this.loadingFresh() || !this.selectedMods().length) return;
    this.downloading.set(true);
    this.downloadError.set('');
    this.downloadController = new AbortController();
    try {
      const bytes = await createModBundle(this.selectedMods(), message => this.downloadStatus.set(message), this.downloadController.signal);
      if (this.destroyRef.destroyed) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dragoonmods-mods.zip';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      this.downloadStatus.set('ZIP ready. Extract its contents directly into your SC mods folder.');
    } catch (error) {
      if (this.destroyRef.destroyed) return;
      this.downloadStatus.set('');
      this.downloadError.set(error instanceof Error ? error.message : 'The ZIP could not be created. Please try again.');
    } finally {
      this.downloading.set(false);
    }
  }

  setSort(value: string): void {
    if (value === 'featured' || value === 'name' || value === 'author') void this.setFilters({ sort: value });
  }

  clearFilters(): void {
    void this.setFilters({ query: '', version: '', sort: 'featured' });
  }

  async setFilters(filters: Partial<{ query: string; version: string; sort: ModSort }>): Promise<void> {
    if (filters.query !== undefined) this.query.set(filters.query);
    if (filters.version !== undefined) this.version.set(filters.version);
    if (filters.sort !== undefined) this.sort.set(filters.sort);
    await this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'merge', preserveFragment: true, replaceUrl: true,
      queryParams: { q: this.query() || null, version: this.version() || null, sort: this.sort() === 'featured' ? null : this.sort() } });
  }

  selectionState() {
    return { selected: this.selectedMods().map(mod => ({ id: mod.id, name: mod.name, release: mod.releases[0] })),
      loadingFresh: this.loadingFresh(), downloading: this.downloading() };
  }

  setAgentSelection(input: unknown) {
    const { ids } = toolInput(input, ['ids']);
    if (!Array.isArray(ids) || ids.length > MOD_CATALOG.length || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw new Error('Expected unique mod IDs');
    if (this.loadingFresh() || this.downloading()) throw new Error('Wait for release checks and downloads to finish');
    if (ids.some(id => !this.catalog().some(mod => mod.id === id && mod.section !== 'tools' && !!modDownload(mod)))) throw new Error('Selection contains unknown, standalone, unreleased or uncached mods');
    this.selected.set(new Set(ids));
    this.downloadError.set('');
    this.downloadStatus.set('');
    return this.selectionState();
  }
}
