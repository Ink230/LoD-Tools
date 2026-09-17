import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ColDef, GridOptions } from 'ag-grid-community';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FastRouterLinkDirective } from '../../../directives/fast-router-link.directive';
import { Element } from '../../../models/game-data.model';
import { GameDataService } from '../../../services/game-data.service';
import { GridDisplayComponent } from '../../grid-display/grid-display.component';

type Row = Record<string, string | number | boolean | null>;
const SECTIONS = ['dragoons', 'additions', 'spells', 'items', 'submaps', 'stages', 'encounters', 'enemies'];
const COLUMNS: Record<string, string[]> = {
  dragoons: ['character', 'name', 'element', 'level', 'mp', 'attack', 'defense', 'magicAttack', 'magicDefense', 'spells'],
  additions: ['character', 'name', 'unlockLevel', 'level', 'hits', 'damage', 'sp'],
  spells: ['id', 'name', 'element', 'mpCost', 'target', 'damage', 'accuracy', 'description'],
  items: ['name', 'category', 'slot', 'price', 'attack', 'matk', 'def', 'mdef', 'spd', 'description'],
  submaps: ['id', 'name', 'category', 'scene', 'encounterRate', 'stageId'],
  stages: ['id', 'name', 'ambientColour', 'modelBytes', 'animationBytes', 'backdropBytes', 'textureBytes'],
  encounters: ['id', 'name', 'type', 'enemies', 'escapeChance', 'musicId'],
  enemies: ['id', 'name', 'element', 'hp', 'attack', 'magicAttack', 'defense', 'magicDefense', 'speed', 'xp', 'gold', 'drop', 'dropChance'],
};
const LABELS: Record<string, string> = { id: 'ID', mp: 'MP', hp: 'HP', xp: 'XP', sp: 'SP', mpCost: 'MP cost', damage: 'Power %', matk: 'Magic attack', def: 'Defense', mdef: 'Magic defense', spd: 'Speed', level: 'Level', unlockLevel: 'Unlock level', dropChance: 'Drop chance %', escapeChance: 'Escape chance %', registryId: 'Registry ID' };
const NOTES: Record<string, string> = {
  dragoons: 'Base Dragoon-level modifiers are percentages. Battle effects and equipment are applied separately. Divine spells unlock with the Divine Dragoon Spirit.',
  additions: 'Each row is an addition level. Damage and SP totals apply the level multiplier to each hit before summing. Select a row for hit timing details.',
  spells: 'Power % follows the game’s STR scale (25% is a ×1 magic multiplier). Recovery and special-effect details are included in the description. Internal spell slots are retained by ID.',
  items: 'Consumables and equipment share this list. Equipment values are modifiers, not final character stats. Select a row to inspect resistances and other properties.',
  submaps: 'Cuts are scene/encounter records indexed by cut ID. Area names use a separate ID space; they are not inferred to be cut names. Encounter rate is SC’s raw rate, not a percentage.',
  stages: 'All 96 retail stage slots are listed, including empty or special-purpose slots. Sizes describe the extracted resources available in the source snapshot.',
  encounters: 'Encounter formations are distinct from battle stages. Repeated enemy names can represent different formations or internal slots. Multi-phase encounters have custom behavior.',
  enemies: 'Retail enemy slots include boss parts and unused entries. Defense values are the raw values consumed by the battle formulas, not player equipment ratings.',
};

@Component({
  selector: 'app-game-data-catalog',
  imports: [FormsModule, FastRouterLinkDirective, GridDisplayComponent],
  templateUrl: './game-data-catalog.component.html',
  styleUrl: './game-data-catalog.component.css',
})
export class GameDataCatalogComponent {
  readonly sections = SECTIONS;
  private readonly characters = inject(GameDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private request = 0;
  section = '';
  search = '';
  category = '';
  rows: Row[] = [];
  filteredRows: Row[] = [];
  selected: Row | null = null;
  loading = false;
  error = '';
  sourceCommit = '';
  colDefs: ColDef[] = [];
  readonly hitColumns: ColDef[] = ['damage', 'sp', 'blueSquareFrames', 'actionInputFrames', 'postHitPauseFrames', 'pauseFrames', 'moveToMonsterFrames', 'distance'].map(field => ({ field, headerName: this.label(field), minWidth: 120 }));
  readonly gridOptions: GridOptions<Row> = {
    defaultColDef: { resizable: true, sortable: true, filter: true, minWidth: 95, flex: 1 },
    pagination: true, paginationPageSize: 25, paginationPageSizeSelector: [25, 50, 100],
    onRowClicked: event => { this.selected = event.data || null; this.cdr.markForCheck(); },
  };

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe(data => { void this.load(String(data['section'])); });
  }

  label(key: string): string { return LABELS[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase()); }
  get note() { return NOTES[this.section]; }
  get categoryField() { return this.section === 'dragoons' || this.section === 'additions' ? 'character' : ['items', 'submaps', 'spells'].includes(this.section) ? 'category' : this.section === 'encounters' ? 'type' : 'element'; }
  get categories() { return [...new Set(this.rows.map(row => row[this.categoryField]).filter(Boolean))].map(String).sort(); }
  get details() { return Object.entries(this.selected || {}).filter(([key]) => key !== 'source' && key !== 'hitDetails'); }
  get selectedHits(): Row[] { return this.selected?.['hitDetails'] ? JSON.parse(String(this.selected['hitDetails'])) : []; }
  get sourceUrl() { return `https://github.com/Legend-of-Dragoon-Modding/Severed-Chains/blob/${this.sourceCommit || 'main'}/src/main/java/${this.selected?.['source'] || 'legend/lodmod/LodSpells.java'}`; }
  display(value: unknown) { return value === null || value === undefined || value === '' ? '—' : String(value); }

  filter() {
    const query = this.search.trim().toLowerCase();
    this.filteredRows = this.rows.filter(row => (!this.category || row[this.categoryField] === this.category) && (!query || Object.values(row).some(value => String(value ?? '').toLowerCase().includes(query))));
    this.selected = null;
  }

  async load(section = this.section) {
    const request = ++this.request;
    this.section = section;
    this.search = this.category = this.error = '';
    this.selected = null;
    this.rows = this.filteredRows = [];
    this.loading = true;
    try {
      if (!SECTIONS.includes(section)) throw new Error('Unknown game-data section');
      const provenance = await fetch('assets/game-data/provenance.json');
      if (!provenance.ok) throw new Error('Source information could not be loaded');
      const metadata = await provenance.json();
      let rows: Row[];
      if (section === 'dragoons') {
        rows = this.characters.characterData.flatMap(character => character.dragoons.flatMap(dragoon => dragoon.dragoonStats.map(stats => ({ ...stats, character: character.firstName, name: dragoon.name, element: Element[dragoon.element], spells: dragoon.spells.map(spell => `${spell.name} (${spell.unlockLevel ? 'D-Level ' + spell.unlockLevel : 'Divine spirit'})`).join(', '), source: `legend/lodmod/characters/${character.firstName}Template.java` }))));
      } else if (section === 'additions') {
        rows = this.characters.characterData.flatMap(character => (character.additions || []).flatMap(addition => addition.levels.map((level, index) => {
          const last = addition.hitData.findIndex(hit => hit.lastHit);
          const hits = last >= 0 ? addition.hitData.slice(0, last + 1) : addition.hitData;
          return { character: character.firstName, id: addition.id, name: addition.name, unlockLevel: addition.unlockLevel, level: index + 1, hits: hits.length, damage: hits.reduce((total, hit) => total + Math.floor(hit.damage * (1 + level.multiplier.damage / 100)), 0), sp: hits.reduce((total, hit) => total + Math.floor(hit.sp * (1 + level.multiplier.sp / 100)), 0), hitDetails: JSON.stringify(hits), source: `legend/lodmod/characters/${character.firstName}Template.java` };
        })));
      } else {
        const response = await fetch(`assets/game-data/${section}.json`);
        if (!response.ok) throw new Error('Game data could not be loaded');
        rows = await response.json();
        if (!Array.isArray(rows)) throw new Error('Invalid game data');
      }
      if (request !== this.request) return;
      this.sourceCommit = metadata.sourceCommit;
      this.rows = rows;
      this.colDefs = COLUMNS[section].map(field => ({ field, headerName: section === 'additions' && field === 'damage' ? 'Damage %' : this.label(field), minWidth: ['name', 'description', 'enemies', 'spells'].includes(field) ? 200 : 95, tooltipField: field, valueFormatter: params => this.display(params.value) }));
      this.filter();
    } catch (error) {
      if (request === this.request) this.error = error instanceof Error ? error.message : 'Game data could not be loaded';
    } finally {
      if (request === this.request) { this.loading = false; this.cdr.markForCheck(); }
    }
  }
}
