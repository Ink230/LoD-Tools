export interface FieldPresentation {
  label: string;
  description?: string;
  numeric?: boolean;
  integer?: boolean;
  preservePrecision?: boolean;
}

const FIELDS: Record<string, FieldPresentation> = {
  standalone: { label: 'Standalone world', description: 'Use only this preset graph instead of overlaying the retail world' },
  startingPortal: { label: 'Starting portal', description: 'Default entry for a standalone world' },
  recoveryPortal: { label: 'Recovery portal', description: 'Safe accessible arrival when a saved destination is unavailable' },
  motion: { label: 'Movement mode', description: 'Distance keeps walking speed independent of point spacing' },
  unitsPerStep: { label: 'Distance per step', numeric: true, preservePrecision: true },
  composition: { label: 'Availability composition', description: 'Replace the story baseline, add availability, or restrict it' },
  combatStageId: { label: 'Combat stage provider', description: 'Registered SC battle-stage ID; native index supplies fallback' },
  music: { label: 'Music policy' },
  musicChapter: { label: 'Music chapter', numeric: true, integer: true },
  omitBackground: { label: 'Omit background' },
  omitLocationSounds: { label: 'Omit location sounds' },
  background: { label: 'Background asset' },
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
  fromId: { label: 'World Map Entry', description: 'The submap you were last on when entering the world map. Matches the submap exit to this world-map portal.' },
  toId: { label: 'World Map Exit', description: 'The submap you load into when exiting the world map through this portal.' },
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
  overviewBrightness: { label: 'Overview brightness', description: 'Lighting brightness while the overview map is active, from 0 through 1', numeric: true, preservePrecision: true },
  transitionBrightness: { label: 'Transition brightness', description: 'Boundary brightness where dimming snaps to overview brightness and return fading begins; it must be from overview brightness through 1', numeric: true, preservePrecision: true },
  transitionStep: { label: 'Transition step', description: 'Positive lighting transition amount applied each update', numeric: true, preservePrecision: true },
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
  if (element.parentElement?.tagName === 'scene' && ['x', 'y', 'z'].includes(attribute)) return { label: attribute.toUpperCase(), numeric: true, preservePrecision: true };
  if (element.closest('submapDestination > data')) {
    if (attribute === 'value') return { label: 'Value', numeric: element.getAttribute('type') === 'float', preservePrecision: true };
    if (attribute === 'type') return { label: 'Value type' };
    if (attribute === 'key') return { label: 'Map key' };
  }
  if (['xAxis', 'yAxis', 'zAxis'].includes(element.tagName) && ['x', 'y', 'z'].includes(attribute)) return { label: attribute.toUpperCase(), numeric: true, preservePrecision: true, description: 'Affine scene basis component' };
  if (element.tagName === 'coolonDestination') {
    const fields: Record<string, FieldPresentation> = {
      defaultDestination: { label: 'Default Destination', description: 'Destination initially selected when opening Coolon travel from this origin. It does not automatically travel there; the player can select another destination.' },
      opensMenuOnArrival: { label: 'Opens Menu On Arrival', description: 'Automatically opens the Coolon travel menu when entering the world map from the submap exit matching this portal\'s World Map Entry mapping. This controls opening the menu, not where a Coolon flight lands.' },
      order: { label: 'Order', description: 'Position in the ordered Coolon destination list; lower values come first. Each destination must have a unique order. This is not its map position or flight priority.', numeric: true, integer: true },
      worldMapArrival: { label: 'World Map Arrival', description: 'When flying to this destination: true returns to the world map using the portal\'s World Map Entry mapping; false enters the submap specified by its World Map Exit mapping. Separate from automatically opening the Coolon menu.' },
    };
    if (fields[attribute]) return fields[attribute];
  }
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
  if (element.tagName === 'item' && attribute === 'value' && element.parentElement?.tagName === 'percentages') return { label: 'Encounter percentage', description: 'Selection chance for this encounter slot; all four slots must total 100%', numeric: true, integer: true, preservePrecision: true };
  if (attribute === 'nativeIndex') {
    if (element.tagName === 'thumbnailDefinition')
      return { label: 'Native thumbnail index', description: 'Retail thumbnail file index; use -1 when an asset or provider supplies the image', numeric: true, integer: true };
    if (element.tagName === 'soundDefinition')
      return { label: 'Native sound index', description: 'Retail sound resource represented by this registry ID', numeric: true, integer: true };
    if (element.tagName === 'battleStageDefinition')
      return { label: 'Native battle-stage index', description: 'Retail battle stage represented by this registry ID; -1 selects the default world-map stage', numeric: true, integer: true };
  }
  if (['x', 'y', 'z'].includes(attribute)) {
    if (element.tagName === 'ambient' || element.tagName === 'colour') {
      const channel = ({ x: 'Red', y: 'Green', z: 'Blue' } as Record<string, string>)[attribute];
      return { label: `${channel} (RGB)`, description: `${element.tagName === 'ambient' ? 'Ambient' : 'Light colour'} ${channel.toLowerCase()} component from 0 through 1`, numeric: true, preservePrecision: true };
    }
    if (element.tagName === 'direction') return { label: `Direction ${attribute.toUpperCase()}`, description: 'Light direction component; the full direction must not be zero', numeric: true, preservePrecision: true };
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
