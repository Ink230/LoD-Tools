import { describe, expect, it } from 'vitest';
import { ModListing } from './mod-catalog';
import { filterMods, modSection } from './mod-collection-state';

const mods: readonly ModListing[] = [
  { id: 'a', name: 'Alpha', authors: [{ name: 'Zed', url: '' }], description: 'Randomize battles', section: 'developer', releases: [{ compatibility: 'Latest SC', url: '' }], tags: ['Randomizer'], infoUrl: '', rating: 4.5 },
  { id: 'b', name: 'Beta', authors: [{ name: 'Ink', url: '' }], description: 'New maps', section: 'top-rated', releases: [{ compatibility: 'RB3', url: '' }], tags: [], infoUrl: '', rating: 4.9 },
  { id: 'c', name: 'Gamma', authors: [{ name: 'Alice', url: '' }], description: 'Battle tweaks', section: 'other', releases: [{ compatibility: 'Latest SC', url: 'latest' }, { compatibility: 'RB3', url: 'rb3' }], tags: ['Extension'], infoUrl: '' },
];

describe('mod discovery', () => {
  it('combines case-insensitive search terms across fields with exact compatibility filtering', () => {
    expect(filterMods(mods, '  INK maps ', 'RB3', 'name').map(mod => mod.id)).toEqual(['b']);
    expect(filterMods(mods, 'Ink', 'Latest SC', 'name')).toEqual([]);
    expect(filterMods(mods, '', 'RB3', 'name').map(mod => mod.id)).toEqual(['b', 'c']);
    expect(filterMods(mods, 'extension', '', 'featured').map(mod => mod.id)).toEqual(['c']);
  });

  it('sorts ratings with unrated entries last without mutating the catalog', () => {
    expect(filterMods(mods, '', '', 'rating').map(mod => mod.id)).toEqual(['b', 'a', 'c']);
    expect(filterMods(mods, '', '', 'author').map(mod => mod.id)).toEqual(['c', 'b', 'a']);
    expect(mods.map(mod => mod.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps developer, rated community, and other community entries disjoint', () => {
    expect(mods.map(modSection)).toEqual(['developer', 'top-rated', 'other']);
    expect(filterMods(mods, 'missing', '', 'name')).toEqual([]);
  });

  it('does not infer latest SC support for an unreleased project or standalone asset tool', () => {
    const upcoming: ModListing = { ...mods[0], id: 'upcoming', releases: [], inDevelopment: true };
    const tool: ModListing = { ...mods[0], id: 'tool', section: 'tools', releases: [{ version: '1', url: 'download' }] };
    expect(filterMods([upcoming, tool], '', 'Latest SC', 'featured')).toEqual([]);
    expect(filterMods([upcoming, tool], '', 'Check compatibility', 'featured').map(mod => mod.id)).toEqual(['upcoming']);
  });
});
