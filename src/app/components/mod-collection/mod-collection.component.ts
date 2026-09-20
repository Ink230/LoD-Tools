import { Component, computed, signal } from '@angular/core';
import { StyledSelectComponent } from '../shared/styled-select/styled-select.component';
import { WORLD_MAP_THEME_COLORS } from '../world-map-editor/world-map-theme';
import { MOD_CATALOG, ScCompatibility } from './mod-catalog';
import { ModCardComponent } from './mod-card.component';
import { filterMods, modSection, ModSort } from './mod-collection-state';

@Component({
  selector: 'app-mod-collection',
  host: { '[style]': 'themeColors' },
  imports: [StyledSelectComponent, ModCardComponent],
  templateUrl: './mod-collection.component.html',
  styleUrl: './mod-collection.component.css',
})
export class ModCollectionComponent {
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly query = signal('');
  readonly version = signal('');
  readonly sort = signal<ModSort>('featured');
  readonly versions: readonly ScCompatibility[] = ['Latest SC', 'RB3', 'Special build', 'Check compatibility'];
  readonly versionOptions = [{ value: '', label: 'All versions' }, ...this.versions.map(value => ({ value, label: value }))];
  readonly sortOptions = [{ value: 'featured', label: 'Featured' }, { value: 'name', label: 'Name A–Z' }, { value: 'author', label: 'Author A–Z' }];
  readonly filtered = computed(() => filterMods(MOD_CATALOG, this.query(), this.version(), this.sort()));
  readonly sections = computed(() => [
    { id: 'developer', title: 'SC Dev Made Mods', description: 'Mods maintained by SC developers.' },
    { id: 'top-rated', title: 'Top Rated Community Mods', description: 'Community picks worth exploring. Curated recommendations; community ratings are not available yet.' },
    { id: 'other', title: 'Other Mods', description: 'More community-created mods.' },
  ].map(section => ({
    ...section,
    mods: this.filtered().filter(mod => modSection(mod) === section.id),
    populated: MOD_CATALOG.some(mod => modSection(mod) === section.id),
  })));
  readonly tools = computed(() => this.filtered().filter(mod => mod.section === 'tools'));

  setSort(value: string): void {
    if (value === 'featured' || value === 'name' || value === 'rating' || value === 'author') this.sort.set(value);
  }

  clearFilters(): void {
    this.query.set('');
    this.version.set('');
    this.sort.set('featured');
  }
}
