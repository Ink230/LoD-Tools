import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WORLD_MAP_THEME_COLORS } from '../world-map-editor/world-map-theme';
import { MOD_CATALOG } from './mod-catalog';
import { ModCardComponent } from './mod-card.component';
import { filterMods, modSection, ModSort } from './mod-collection-state';

@Component({
  selector: 'app-mod-collection',
  host: { '[style]': 'themeColors' },
  imports: [FormsModule, ModCardComponent],
  templateUrl: './mod-collection.component.html',
  styleUrl: './mod-collection.component.css',
})
export class ModCollectionComponent {
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly query = signal('');
  readonly version = signal('');
  readonly sort = signal<ModSort>('featured');
  readonly versions = [...new Set(MOD_CATALOG.flatMap(mod => [...mod.scVersions]))];
  readonly filtered = computed(() => filterMods(MOD_CATALOG, this.query(), this.version(), this.sort()));
  readonly sections = computed(() => [
    { id: 'developer', title: 'SC Dev Made Mods', description: 'Official / first-party mods maintained by the SC developers.' },
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
