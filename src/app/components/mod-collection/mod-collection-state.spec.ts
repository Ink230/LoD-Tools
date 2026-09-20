import { describe, expect, it } from 'vitest';
import { ModListing } from './mod-catalog';
import { filterMods, modSection } from './mod-collection-state';

const mods: readonly ModListing[] = [
  { id: 'a', name: 'Alpha', author: 'Zed', description: 'Randomize battles', section: 'developer', version: '1', scVersions: ['0.9.4'], githubUrl: '', rating: 4.5 },
  { id: 'b', name: 'Beta', author: 'Ink', description: 'New maps', section: 'top-rated', version: '2', scVersions: ['0.9.3'], githubUrl: '', rating: 4.9 },
  { id: 'c', name: 'Gamma', author: 'Alice', description: 'Battle tweaks', section: 'other', version: '1', scVersions: ['0.9.4', '0.9.3'], githubUrl: '' },
];

describe('mod discovery', () => {
  it('combines case-insensitive search terms across fields with exact compatibility filtering', () => {
    expect(filterMods(mods, '  INK maps ', '0.9.3', 'name').map(mod => mod.id)).toEqual(['b']);
    expect(filterMods(mods, 'Ink', '0.9.4', 'name')).toEqual([]);
    expect(filterMods(mods, '', '0.9.3', 'name').map(mod => mod.id)).toEqual(['b', 'c']);
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
});
