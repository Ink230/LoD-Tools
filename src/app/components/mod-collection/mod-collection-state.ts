import { ModListing } from './mod-catalog';

export type ModSort = 'featured' | 'name' | 'rating' | 'author';
export type ModSection = ModListing['section'];

export function modSection(mod: ModListing): ModSection {
  return mod.section;
}

export function filterMods(mods: readonly ModListing[], query: string, version: string, sort: ModSort): ModListing[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return mods.filter(mod => {
    const text = `${mod.name} ${mod.author} ${mod.description}`.toLocaleLowerCase();
    return terms.every(term => text.includes(term)) && (!version || mod.scVersions.includes(version));
  }).sort((a, b) => {
    if (sort === 'featured') return 0;
    if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name);
    if (sort === 'author') return a.author.localeCompare(b.author) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}
