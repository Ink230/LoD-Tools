export interface FieldPresentation {
  label: string;
  description?: string;
  numeric?: boolean;
  integer?: boolean;
}

const FIELDS: Record<string, FieldPresentation> = {
  id: { label: 'Registry ID', description: 'Stable namespace:entry identifier used by presets and mods' },
  legacyIndex: { label: 'Native slot', description: 'Retail array slot retained for save and native-data compatibility', numeric: true, integer: true },
  name: { label: 'Name', description: 'Name displayed for this world-map entry' },
  label: { label: 'Display label', description: 'Human-readable name shown to authors and players where supported' },
  provider: { label: 'Provider', description: 'Registry ID supplied by an installed mod' },
  thumbnailId: { label: 'Thumbnail', description: 'Thumbnail definition registry ID' },
  services: { label: 'Native services mask', description: 'Retail bitmask used only when service IDs are absent', numeric: true, integer: true },
  thumbnail: { label: 'Native thumbnail index', description: 'Retail thumbnail file index used only when a thumbnail ID is absent', numeric: true, integer: true },
  battleStageId: { label: 'Battle stage', description: 'Battle-stage definition registry ID' },
  battleStage: { label: 'Native battle-stage index', description: 'Retail battle-stage index used only when a battle-stage ID is absent', numeric: true, integer: true },
  avatar: { label: 'Avatar', description: 'World-map avatar registry ID used while traversing this route' },
  modelIndex: { label: 'Native avatar index', description: 'Retail player-model index used only when an avatar ID is absent', numeric: true, integer: true },
  legacyEncounterPlaceholder: { label: 'Native encounter slot', description: 'Retail encounter-table placeholder retained for compatibility', numeric: true, integer: true },
  legacyBit: { label: 'Native service bit', description: 'Optional retail service bit whose presentation label this definition follows', numeric: true, integer: true },
  fromId: { label: 'Arrival destination', description: 'Submap destination registry ID used when entering the world map' },
  toId: { label: 'Departure destination', description: 'Submap destination registry ID used when leaving the world map' },
  cut: { label: 'Submap cut', description: 'SC submap cut number represented by this destination', numeric: true, integer: true },
  scene: { label: 'Submap scene', description: 'SC submap scene number represented by this destination', numeric: true, integer: true },
  effectFlags: { label: 'Native effect flags', description: 'Retail atmosphere and smoke bitfield fallback', numeric: true, integer: true },
  atmosphere: { label: 'Atmosphere', description: 'Named world-map atmosphere effect' },
  smoke: { label: 'Smoke', description: 'Named location smoke effect' },
  junctionIndex: { label: 'Native junction index', description: 'Retail junction table index; -1 means this portal is not a junction', numeric: true, integer: true },
  continent: { label: 'Native continent', description: 'Retail continent fallback used when no region ID is supplied' },
  asset: { label: 'Packaged asset', description: 'Relative path to an asset included in the .wmap package' },
  encounterRate: { label: 'Encounter rate', description: 'Relative random-encounter rate for this route', numeric: true },
  direction: { label: 'Direction', description: 'Forward or reverse traversal over the geometry' },
  x: { label: 'X', description: 'Numeric X component', numeric: true },
  y: { label: 'Y', description: 'Numeric Y component', numeric: true },
  z: { label: 'Z', description: 'Numeric Z component', numeric: true },
  speedMultiplier: { label: 'Speed multiplier', description: 'Multiplier applied to avatar movement speed', numeric: true },
  progress: { label: 'Route progress', description: 'Position along the route from 0 to 1', numeric: true },
  projectionDistance: { label: 'Projection distance', description: 'World-map camera projection distance', numeric: true },
  order: { label: 'Order', description: 'Stable evaluation and display order', numeric: true, integer: true },
  storyFlag: { label: 'Story flag', description: 'Retail story progression flag', numeric: true, integer: true },
};

const COMPATIBILITY_ATTRIBUTES: Record<string, string[]> = {
  '*': ['legacyIndex'],
  place: ['thumbnail', 'services'],
  route: ['battleStage', 'modelIndex', 'legacyEncounterPlaceholder'],
  portal: ['junctionIndex', 'continent', 'effectFlags'],
  serviceDefinition: ['legacyBit'],
};

const COMPATIBILITY_CHILDREN: Record<string, string[]> = {
  place: ['sounds'],
  portal: ['from', 'to'],
};

export function fieldPresentation(element: Element, attribute: string): FieldPresentation {
  if (element.tagName === 'item' && attribute === 'id') {
    const parent = element.parentElement?.tagName;
    if (parent === 'serviceIds') return { label: 'Service', description: 'World-map service definition registry ID' };
    if (parent === 'soundIds') return { label: 'Sound', description: 'World-map sound definition registry ID' };
    if (parent === 'encounters') return { label: 'Encounter', description: 'Encounter registry ID' };
    if (parent === 'routes') return { label: 'Route', description: 'World-map route registry ID' };
    if (parent === 'enabledPortals') return { label: 'Portal', description: 'World-map portal registry ID' };
  }
  if (element.tagName === 'item' && attribute === 'value' && element.parentElement?.tagName === 'sounds')
    return { label: 'Native sound index', description: 'Retail sound index used only when sound IDs are absent', numeric: true, integer: true };
  if (attribute === 'nativeIndex') {
    if (element.tagName === 'thumbnailDefinition')
      return { label: 'Native thumbnail index', description: 'Retail thumbnail file index; use -1 when an asset or provider supplies the image', numeric: true, integer: true };
    if (element.tagName === 'soundDefinition')
      return { label: 'Native sound index', description: 'Retail sound resource represented by this registry ID', numeric: true, integer: true };
    if (element.tagName === 'battleStageDefinition')
      return { label: 'Native battle-stage index', description: 'Retail battle stage represented by this registry ID; -1 selects the default world-map stage', numeric: true, integer: true };
  }
  if (['x', 'y', 'z'].includes(attribute)) {
    if (['position', 'translation', 'viewpoint', 'refpoint', 'overviewPosition', 'minimum', 'maximum', 'visualOffset'].includes(element.tagName))
      return { label: attribute.toUpperCase(), description: attribute === 'y' ? 'World-space height coordinate' : `World-space ${attribute.toUpperCase()} coordinate`, numeric: true };
    if (element.tagName === 'item' && ['points', 'mapPositions'].includes(element.parentElement?.tagName))
      return { label: attribute.toUpperCase(), description: attribute === 'y' ? 'World-space height coordinate' : `World-space ${attribute.toUpperCase()} coordinate`, numeric: true };
    if (element.tagName === 'scale') return { label: attribute.toUpperCase(), description: 'Model scale factor for this axis', numeric: true };
    if (element.tagName === 'coolonDestination') return { label: attribute.toUpperCase(), description: 'Coolon destination-menu position', numeric: true };
    if (element.tagName === 'storyPreset') return { label: attribute.toUpperCase(), description: 'Retail overview-map position', numeric: true };
  }
  return FIELDS[attribute] || { label: humanize(attribute) };
}

export function isCompatibilityAttribute(element: Element, attribute: string): boolean {
  return [...(COMPATIBILITY_ATTRIBUTES['*'] || []), ...(COMPATIBILITY_ATTRIBUTES[element.tagName] || [])].includes(attribute);
}

export function isCompatibilityChild(element: Element, child: Element): boolean {
  return (COMPATIBILITY_CHILDREN[element.tagName] || []).includes(child.tagName);
}

export function humanize(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}
