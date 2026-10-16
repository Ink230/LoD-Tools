import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
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
  private downloadController?: AbortController;
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly query = signal('');
  readonly version = signal('');
  readonly sort = signal<ModSort>('featured');
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly catalog = this.releases.catalog;
  readonly releaseStatus = this.releases.status;
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
    { id: 'developer', title: 'SC Dev Made Mods', description: 'Mods maintained by SC developers.' },
    { id: 'top-rated', title: 'Top Rated Community Mods', description: 'Manually selected community mods. Community ratings are not available yet.' },
    { id: 'other', title: 'Other Mods', description: 'More community-created mods.' },
  ].map(section => ({
    ...section,
    mods: this.filtered().filter(mod => modSection(mod) === section.id),
    populated: this.catalog().some(mod => modSection(mod) === section.id),
  })));
  readonly tools = computed(() => this.filtered().filter(mod => mod.section === 'tools'));

  constructor() {
    this.destroyRef.onDestroy(() => this.downloadController?.abort());
    effect(() => {
      if (this.downloading()) return;
      const eligible = new Set(this.catalog().filter(mod => modDownload(mod)).map(mod => mod.id));
      const selected = new Set([...this.selected()].filter(id => eligible.has(id)));
      if (selected.size !== this.selected().size) {
        this.selected.set(selected);
        this.downloadStatus.set('Some selections were cleared because a newer release is not available in the combined ZIP yet. Use its release link to download it separately.');
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
    if (this.downloading() || !modDownload(mod)) return;
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
    if (this.downloading() || !this.selectedMods().length) return;
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
    if (value === 'featured' || value === 'name' || value === 'rating' || value === 'author') this.sort.set(value);
  }

  clearFilters(): void {
    this.query.set('');
    this.version.set('');
    this.sort.set('featured');
  }
}
