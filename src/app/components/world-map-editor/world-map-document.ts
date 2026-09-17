import { fieldPresentation } from './world-map-field-metadata';

export const SECTIONS: Record<string, string> = {
  nodes: 'node',
  geometry: 'geometry',
  routes: 'route',
  places: 'place',
  portals: 'portal',
  encounterPools: 'encounterPool',
  storyPresets: 'storyPreset',
  coolonDestinations: 'coolonDestination',
  teleportLinks: 'teleportLink',
  regions: 'region',
  avatars: 'avatar',
  traversalProfiles: 'traversalProfile',
  presentationProfiles: 'presentationProfile',
  requiredMods: 'mod',
  behaviours: 'behaviour',
  thumbnailDefinitions: 'thumbnailDefinition',
  serviceDefinitions: 'serviceDefinition',
  soundDefinitions: 'soundDefinition',
  battleStageDefinitions: 'battleStageDefinition',
  submapDestinations: 'submapDestination',
  rules: 'rules',
  removals: 'remove',
  thumbnails: 'thumbnail',
};

const POINT = 'x="0" y="0" z="0"';
export const TEMPLATES: Record<string, string> = {
  node: `<node><position ${POINT}/></node>`,
  geometry: `<geometry legacyIndex="-1" motion="DISTANCE" unitsPerStep="1"><points><item ${POINT}/><item x="100" y="0" z="0"/></points></geometry>`,
  place: '<place legacyIndex="-1" name="New place" thumbnail="0" services="0"><serviceIds/><soundIds/><sounds><item value="-1"/><item value="-1"/><item value="-1"/><item value="-1"/></sounds></place>',
  route: '<route legacyIndex="-1" start="" end="" geometry="" direction="1" encounterRate="0" battleStage="0" modelIndex="0" legacyEncounterPlaceholder="0"/>',
  portal: '<portal legacyIndex="-1" junctionIndex="0" continent="SOUTH_SERDIO_0" fullBrightness="false" effectFlags="0" atmosphere="NONE" smoke="NONE"><from cut="0" scene="0"/><to cut="0" scene="0"/></portal>',
  encounterPool: '<encounterPool legacyIndex="-1"><encounters><item id=""/><item id=""/><item id=""/><item id=""/></encounters></encounterPool>',
  storyPreset: '<storyPreset order="0" storyFlag="0" x="0" y="0"><enabledPortals/></storyPreset>',
  coolonDestination: `<coolonDestination order="0" portal="" defaultDestination="" x="0" y="0" label="New destination" worldMapArrival="false" opensMenuOnArrival="false"><position ${POINT}/></coolonDestination>`,
  teleportLink: `<teleportLink order="0" source="" destination="" autoStartOnArrival="false"><translation ${POINT}/></teleportLink>`,
  region: `<region legacyTemplate="SOUTH_SERDIO_0" provider="" presentationProvider=""><camera projectionDistance="320" overviewEnabled="false"><viewpoint ${POINT}/><refpoint ${POINT}/></camera></region>`,
  avatar: '<avatar provider=""/>',
  traversalProfile: '<traversalProfile priority="0" includeReverseRoutes="false" speedMultiplier="1"><routes/><markers/><warps/></traversalProfile>',
  presentationProfile: '<presentationProfile><capabilities retailLabels="false" retailWater="false" retailAvatars="false"/><namedElements/><namedTextures/></presentationProfile>',
  mod: '<mod/>',
  behaviour: '<behaviour/>',
  thumbnailDefinition: '<thumbnailDefinition nativeIndex="-1" label="New thumbnail"/>',
  serviceDefinition: '<serviceDefinition label="New service"/>',
  soundDefinition: '<soundDefinition nativeIndex="" label="New sound"/>',
  battleStageDefinition: '<battleStageDefinition nativeIndex="-1" label="New battle stage"/>',
  submapDestination: '<submapDestination cut="0" scene="0" label="New submap destination"/>',
  rules: '<rules policy="STORY"><capabilities/><portals/></rules>',
  remove: '<remove kind="nodes"/>',
  thumbnail: '<thumbnail texture="assets/thumbnail.tim"/>',
};

export const OPTIONAL_ATTRIBUTES: Record<string, string[]> = {
  worldMapPreset: ['standalone', 'startingPortal', 'recoveryPortal'],
  geometry: ['motion', 'unitsPerStep'],
  region: ['legacyTemplate'],
  resources: ['background', 'omitBackground', 'music', 'musicChapter', 'omitLocationSounds'],
  leader: ['texture'],
  place: ['name', 'thumbnailId'],
  route: ['encounterPool', 'avatar', 'battleStageId'],
  portal: ['route', 'place', 'region', 'fromId', 'toId', 'atmosphere', 'smoke'],
  thumbnailDefinition: ['asset', 'provider', 'label'],
  serviceDefinition: ['legacyBit'],
  soundDefinition: ['label'],
  battleStageDefinition: ['label', 'combatStageId'],
  submapDestination: ['label', 'provider'],
  storyPreset: ['place', 'composition'],
  avatar: ['provider'],
  traversalProfile: ['provider', 'avatar'],
  item: ['marker'],
  assets: ['texture'],
  rules: ['policy'],
};

export function parsePreset(source: string): XMLDocument {
  if (new TextEncoder().encode(source).byteLength > 16 * 1024 * 1024) throw new Error('Preset XML exceeds 16 MB');
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('DTD and entity declarations are not supported');
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) throw new Error(error.textContent || 'Invalid XML');
  if (doc.documentElement.tagName !== 'worldMapPreset' || doc.documentElement.getAttribute('version') !== '1') {
    throw new Error('Expected <worldMapPreset version="1">');
  }
  return doc;
}

export function serializePreset(doc: XMLDocument): string {
  // Reindent only element-only content; text and extension payloads remain intact
  const copy = doc.cloneNode(true) as XMLDocument;
  const indent = (element: Element, depth: number) => {
    if (!element.children.length || Array.from(element.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    Array.from(element.childNodes)
      .filter((n) => n.nodeType === 3)
      .forEach((n) => n.remove());
    Array.from(element.children).forEach((child) => {
      element.insertBefore(copy.createTextNode('\n' + '  '.repeat(depth + 1)), child);
      indent(child, depth + 1);
    });
    element.appendChild(copy.createTextNode('\n' + '  '.repeat(depth)));
  };
  indent(copy.documentElement, 0);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(copy.documentElement) + '\n';
}

export function entries(doc: XMLDocument, section: string): Element[] {
  if (section === 'rules') return Array.from(doc.documentElement.children).filter((e) => e.tagName === 'rules');
  return Array.from(doc.documentElement.children).find((e) => e.tagName === section) ? Array.from(Array.from(doc.documentElement.children).find((e) => e.tagName === section).children) : [];
}

export function renameRegistryEntry(element: Element, value: string): void {
  if (element.parentElement?.tagName === 'namedTextures') {
    if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value)) throw new Error('Texture identity must be a registry ID');
    const profile = element.parentElement.parentElement;
    if (Array.from(element.parentElement.children).some((other) => other !== element && other.getAttribute('id') === value)) throw new Error('Duplicate named texture identity');
    const previous = element.getAttribute('id');
    for (const declaration of Array.from(profile.querySelectorAll(':scope > namedElements > item'))) {
      if (declaration.getAttribute('texture') === previous) declaration.setAttribute('texture', value);
    }
    element.setAttribute('id', value);
    return;
  }
  const section = element.parentElement?.tagName;
  const doc = element.ownerDocument;
  const previous = element.getAttribute('id');
  if (previous === value) return;
  if (!section || section === 'requiredMods' || element.parentElement?.parentElement !== doc.documentElement || SECTIONS[section] !== element.tagName || referenceSection(element, 'id')) {
    element.setAttribute('id', value);
    return;
  }
  if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value)) throw new Error('Use a registry ID in namespace:name format');
  if (entries(doc, section).some((entry) => entry !== element && entry.getAttribute('id') === value)) throw new Error(`An entry named ${value} already exists in ${section}`);
  if (previous) {
    for (const target of Array.from(doc.querySelectorAll('*'))) {
      for (const attribute of Array.from(target.attributes)) {
        if (attribute.value === previous && referenceSection(target, attribute.name) === section) target.setAttribute(attribute.name, value);
      }
    }
  }
  element.setAttribute('id', value);
}
export function referenceSection(element: Element, attribute: string): string | undefined {
  if (element.closest('submapDestination > data')) return undefined;
  if (element.tagName === 'worldMapPreset' && ['startingPortal', 'recoveryPortal'].includes(attribute)) return 'portals';
  const fields: Record<string, string> = {
    start: 'nodes',
    end: 'nodes',
    geometry: 'geometry',
    route: 'routes',
    place: 'places',
    region: 'regions',
    encounterPool: 'encounterPools',
    avatar: 'avatars',
    portal: 'portals',
    source: 'portals',
    destination: 'portals',
    defaultDestination: 'coolonDestinations',
    target: 'portals',
    presentationProvider: 'regions',
    thumbnailId: 'thumbnailDefinitions',
    battleStageId: 'battleStageDefinitions',
    fromId: 'submapDestinations',
    toId: 'submapDestinations',
  };
  if (fields[attribute]) return fields[attribute];
  if (attribute === 'provider')
    return element.tagName === 'region' ? 'regions' : element.tagName === 'avatar' ? 'avatars' : element.tagName === 'thumbnailDefinition' ? 'thumbnailDefinitions' : 'traversalProfiles';
  if (attribute === 'id' && element.tagName === 'portal' && element.parentElement?.parentElement?.tagName === 'rules') return 'portals';
  if (attribute === 'id' && element.tagName === 'thumbnail') return 'places';
  if (attribute === 'id' && element.tagName === 'remove') return element.getAttribute('kind');
  if (attribute === 'id' && element.tagName === 'item') {
    return (
      {
        enabledPortals: 'portals',
        routes: 'routes',
        encounters: 'encounters',
        serviceIds: 'serviceDefinitions',
        soundIds: 'soundDefinitions',
      } as Record<string, string>
    )[element.parentElement?.tagName];
  }
  return undefined;
}

export interface Diagnostic {
  message: string;
  element: Element;
  severity: 'error' | 'warning';
}

export function diagnostics(doc: XMLDocument, assetPaths: string[], nativeRegistry: Record<string, string[]> = {}): Diagnostic[] {
  const result: Diagnostic[] = [];
  const registryIds = new Map([...new Set([...Object.keys(SECTIONS), ...Object.keys(nativeRegistry)])].map((section) => [section, new Set([...entries(doc, section).map((entry) => entry.getAttribute('id')), ...(doc.documentElement.getAttribute('standalone') === 'true' && ['nodes', 'geometry', 'routes', 'places', 'portals'].includes(section) ? [] : nativeRegistry[section] || [])])]));
  const removedIds = new Set(entries(doc, 'removals').map((entry) => `${entry.getAttribute('kind')}:${entry.getAttribute('id')}`));
  const add = (element: Element, message: string, severity: 'error' | 'warning' = 'error') => {
    if (!result.some((issue) => issue.message === message)) result.push({ element, message, severity });
  };
  const finiteAttribute = (element: Element, attribute: string) => {
    const value = element.getAttribute(attribute);
    return value !== null && value.trim() !== '' && Number.isFinite(Number(value));
  };
  if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(doc.documentElement.getAttribute('id') || '')) add(doc.documentElement, 'Preset ID must use namespace:entry syntax');
  for (const section of Array.from(doc.documentElement.children)) {
    if (!(section.tagName in SECTIONS)) add(section, `Unknown section ${section.tagName}; runtime rejects unknown fields`);
    const ids = new Set<string>();
    for (const entry of Array.from(section.children)) {
      const id = entry.getAttribute('id');
      if (id && !['requiredMods', 'rules'].includes(section.tagName) && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id)) add(entry, `Invalid registry ID: ${id}`);
      if (id && ids.has(id)) add(entry, `Duplicate ID ${id} in ${section.tagName}`);
      if (id) ids.add(id);
    }
  }
  for (const element of [doc.documentElement, ...Array.from(doc.querySelectorAll('*'))]) {
    if (['presentationProfile', 'layout'].includes(element.tagName)) {
      const capabilities = element.querySelector(':scope > capabilities');
      if (capabilities) {
        for (const flag of ['retailLabels', 'retailWater', 'retailAvatars']) {
          if (!['true', 'false'].includes(capabilities.getAttribute(flag))) add(capabilities, `${flag} must explicitly be true or false`);
        }
      } else {
        for (const [table, minimum] of [['mapPositions', 8], ['regions', 3], ['services', 5], ['waterClutYs', 14], ['playerAvatarVramSlots', 4], ['textureAdjustments', 22]] as const) {
          if (element.querySelectorAll(`:scope > ${table} > item`).length < minimum) add(element, `Legacy presentation requires at least ${minimum} ${table} entries; add explicit capabilities to author an independent profile`);
        }
      }
      const textures = Array.from(element.querySelectorAll(':scope > namedTextures > item'));
      const textureIds = new Set(textures.map((item) => item.getAttribute('id')));
      for (const name of ['namedElements', 'namedTextures']) {
        const identities = new Set<string>();
        for (const item of Array.from(element.querySelectorAll(`:scope > ${name} > item`))) {
          const id = item.getAttribute('id') || '';
          if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id)) add(item, `${name} requires registry IDs`);
          if (identities.has(id)) add(item, `Duplicate ${name} identity ${id}`);
          identities.add(id);
          if (name === 'namedElements') {
            const position = item.querySelector(':scope > position');
            if (!position || ['x', 'y', 'z'].some((axis) => !finiteAttribute(position, axis))) add(item, 'Named elements require finite position coordinates');
            if (item.hasAttribute('texture') && !textureIds.has(item.getAttribute('texture'))) add(item, `Unknown named texture ${item.getAttribute('texture')}`);
          } else if (!item.querySelector(':scope > adjustment')) add(item, 'Named textures require a texture adjustment');
        }
      }
      const adjustments = Math.max(capabilities ? 22 : 0, element.querySelectorAll(':scope > textureAdjustments > item').length);
      for (const slot of Array.from(element.querySelectorAll(':scope > playerAvatarVramSlots > item'))) {
        const value = Number(slot.getAttribute('value'));
        if (!slot.getAttribute('value')?.trim() || !Number.isInteger(value) || value < 0 || value >= adjustments) add(slot, 'Avatar slot must reference an available legacy texture adjustment');
      }
    }
    for (const attribute of ['standalone', 'omitBackground', 'omitLocationSounds']) {
      if (element.hasAttribute(attribute) && !['true', 'false'].includes(element.getAttribute(attribute))) add(element, `${attribute} must be true or false`);
    }
    if (element.tagName === 'submapDestination' && (element.hasAttribute('provider') || element.querySelector(':scope > data')) && (Number(element.getAttribute('cut')) < 2 || Number(element.getAttribute('cut')) >= 2048)) add(element, 'Custom submap destinations require a retail fallback cut from 2 through 2047');
    if (element.tagName === 'resources') {
      if (element.hasAttribute('music') && !['RETAIL_CHAPTER', 'FIXED_CHAPTER', 'SILENT', 'KEEP'].includes(element.getAttribute('music'))) add(element, 'Choose a supported music policy');
      if (Number(element.getAttribute('musicChapter')) < 0) add(element, 'Music chapter must be nonnegative');
      if (element.hasAttribute('background') && element.getAttribute('omitBackground') === 'true') add(element, 'Choose a background asset or omit it, not both');
      for (const name of ['transportTextures', 'transports']) {
        const list = element.querySelector(`:scope > ${name}`);
        if (list && list.children.length !== 3) add(list, 'Transport resources require ship, Coolon and teleport entries');
      }
      const leader = element.querySelector(':scope > leader');
      if (leader && (!leader.getAttribute('texture') || leader.querySelectorAll(':scope > animations > item').length < 3)) add(leader, 'Leader resources require texture and idle, walk and run animations');
    }
    if (element.tagName === 'worldMapPreset' && element.getAttribute('standalone') !== 'true' && (element.hasAttribute('startingPortal') || element.hasAttribute('recoveryPortal'))) add(element, 'Starting and recovery portals require standalone mode');
    if (element.tagName === 'geometry') {
      if (element.hasAttribute('motion') && !['LEGACY_INTERVAL', 'DISTANCE'].includes(element.getAttribute('motion'))) add(element, 'Movement mode must be LEGACY_INTERVAL or DISTANCE');
      if (element.hasAttribute('unitsPerStep') && (!finiteAttribute(element, 'unitsPerStep') || Number(element.getAttribute('unitsPerStep')) <= 0)) add(element, 'Distance per step must be positive and finite');
    }
    if (element.tagName === 'storyPreset' && element.hasAttribute('composition') && !['REPLACE', 'ENABLE', 'DISABLE'].includes(element.getAttribute('composition'))) add(element, 'Story composition must be REPLACE, ENABLE or DISABLE');
    if (element.closest('submapDestination > data')) {
      const type = element.getAttribute('type');
      const value = element.getAttribute('value');
      if (!['map', 'list', 'string', 'int', 'long', 'float', 'bool', 'registry', 'enum', 'raw'].includes(type)) add(element, 'Destination data requires a supported value type');
      if (['map', 'list'].includes(type)) {
        if (value !== null) add(element, 'Container data cannot have a value attribute');
        const keys = new Set<string>();
        for (const child of Array.from(element.children)) {
          if (child.tagName !== 'entry') add(child, 'Destination data containers require entry children');
          const key = child.getAttribute('key');
          if (type === 'map' && (key === null || keys.has(key))) add(child, 'Map entries require unique keys');
          if (key !== null) keys.add(key);
          if (type === 'list' && key !== null) add(child, 'List entries cannot have map keys');
        }
      } else {
        if (type === 'float' && (!value?.trim() || !Number.isFinite(Math.fround(Number(value))))) add(element, 'Float data must fit a finite 32-bit float');
        if (value === null || element.children.length) add(element, 'Scalar data requires a value and no child entries');
        if (type === 'bool' && !['true', 'false'].includes(value)) add(element, 'Boolean data must be true or false');
        if (['int', 'long'].includes(type)) {
          if (!/^[-+]?\d+$/.test(value || '')) add(element, 'Integer data requires a whole number');
          else {
            const number = BigInt(value);
            if (number < (type === 'int' ? -2147483648n : -9223372036854775808n) || number > (type === 'int' ? 2147483647n : 9223372036854775807n)) add(element, 'Integer data exceeds its value type range');
          }
        }
      }
    }
    for (const attribute of Array.from(element.attributes)) {
      const target = referenceSection(element, attribute.name);
      if (target && attribute.value && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(attribute.value)) add(element, `${attribute.name} must use namespace:entry syntax`);
      const removed = target && removedIds.has(`${target}:${attribute.value}`);
      if (removed && element.tagName !== 'remove') add(element, `${attribute.name}: ${attribute.value} refers to a removed ${target} entry`);
      else if (target && element.tagName !== 'remove' && !registryIds.get(target)?.has(attribute.value)) {
        add(element, attribute.value ? `Unknown ${target} reference "${attribute.value}" in ${element.parentElement?.tagName}/${element.tagName} (${attribute.name}). Choose an existing ${target} ID, add its definition to this preset where supported, or enable a mod that registers it in SC; external mod registries cannot be verified here.` : `Missing ${target} reference in ${element.parentElement?.tagName}/${element.tagName} (${attribute.name}). Choose an existing ${target} ID in the inspector.`, attribute.value ? 'warning' : 'error');
      }
      const presentation = fieldPresentation(element, attribute.name);
      if (presentation.numeric && (!attribute.value.trim() || !Number.isFinite(Number(attribute.value)))) add(element, `${attribute.name} must be a finite number`);
      else if (presentation.integer && !Number.isInteger(Number(attribute.value))) add(element, `${attribute.name} must be an integer`);
    }
    if (element.tagName === 'geometry' && element.hasAttribute('id') && element.querySelectorAll('points > item').length < 2) add(element, 'Geometry needs at least two points');
    if (element.tagName === 'encounterPool' && element.querySelectorAll('encounters > item').length !== 4) add(element, 'Encounter pools require exactly four encounter IDs');
    if (element.tagName === 'encounterPool' && element.querySelector('percentages')) {
      const percentages = Array.from(element.querySelectorAll(':scope > percentages > item'));
      const rawValues = percentages.map((item) => item.getAttribute('value') || '');
      const values = rawValues.map(Number);
      if (percentages.length !== 4 || rawValues.some((value) => !/^[-+]?\d+$/.test(value)) || values.some((value) => value < 0 || value > 100) || values.reduce((sum, value) => sum + value, 0) !== 100)
        add(element, 'Encounter percentages require exactly four integer values from 0 through 100 totaling 100');
    }
    if (element.tagName === 'camera' && Boolean(element.querySelector('minimum')) !== Boolean(element.querySelector('maximum')))
      add(element, 'Camera minimum and maximum bounds must be supplied together');
    if (element.tagName === 'camera' && (!element.hasAttribute('projectionDistance') || Number(element.getAttribute('projectionDistance')) <= 0))
      add(element, 'Camera projection distance must be positive');
    if (element.tagName === 'camera' && element.querySelector('minimum') && element.querySelector('maximum')) {
      const minimum = element.querySelector('minimum')!;
      const maximum = element.querySelector('maximum')!;
      if (['x', 'y', 'z'].some((axis) => Number(minimum.getAttribute(axis)) > Number(maximum.getAttribute(axis))))
        add(element, 'Camera minimum bounds must not exceed maximum bounds on any axis');
    }
    if (element.tagName === 'lighting') {
      const brightness = Number(element.getAttribute('overviewBrightness'));
      const transitionBrightness = Number(element.getAttribute('transitionBrightness'));
      const transitionStep = Number(element.getAttribute('transitionStep'));
      const ambient = element.querySelector(':scope > ambient');
      const lights = Array.from(element.querySelectorAll(':scope > lights > item'));
      if (!finiteAttribute(element, 'overviewBrightness') || brightness < 0 || brightness > 1)
        add(element, 'Lighting overview brightness must be finite from 0 through 1');
      if (!finiteAttribute(element, 'transitionBrightness') || transitionBrightness < 0 || transitionBrightness > 1 || transitionBrightness < brightness)
        add(element, 'Lighting transition brightness must be finite from overview brightness through 1');
      if (!finiteAttribute(element, 'transitionStep') || transitionStep <= 0)
        add(element, 'Lighting transition step must be positive and finite');
      if (!ambient || ['x', 'y', 'z'].some((axis) => !finiteAttribute(ambient!, axis) || Number(ambient!.getAttribute(axis)) < 0 || Number(ambient!.getAttribute(axis)) > 1))
        add(element, 'Lighting ambient RGB components must be finite from 0 through 1');
      if (lights.length !== 3 || lights.some((light) => {
        const direction = light.querySelector(':scope > direction');
        const colour = light.querySelector(':scope > colour');
        const directionValues = ['x', 'y', 'z'].map((axis) => Number(direction?.getAttribute(axis)));
        return !direction || !colour || ['x', 'y', 'z'].some((axis) => !finiteAttribute(direction!, axis)) || directionValues.every((value) => value === 0)
          || ['x', 'y', 'z'].some((axis) => !finiteAttribute(colour!, axis) || Number(colour!.getAttribute(axis)) < 0 || Number(colour!.getAttribute(axis)) > 1);
      })) add(element, 'Lighting requires exactly three lights with finite nonzero directions and RGB colours from 0 through 1');
    }
    if (element.tagName === 'route' && !['1', '-1'].includes(element.getAttribute('direction'))) add(element, 'Route direction must be 1 or -1');
    if (element.tagName === 'portal' && element.hasAttribute('atmosphere') && !['NONE', 'CLOUDS', 'SNOW'].includes(element.getAttribute('atmosphere')))
      add(element, 'atmosphere must be NONE, CLOUDS or SNOW');
    if (element.tagName === 'portal' && element.hasAttribute('smoke') && !['NONE', 'MODE_1', 'MODE_2'].includes(element.getAttribute('smoke')))
      add(element, 'smoke must be NONE, MODE_1 or MODE_2');
    if (element.tagName === 'thumbnailDefinition') {
      const nativeIndex = Number(element.getAttribute('nativeIndex'));
      if (!element.hasAttribute('nativeIndex') || !Number.isInteger(nativeIndex) || nativeIndex < -1) add(element, 'Thumbnail definitions require a native index of -1 or greater');
      const backingCount = (element.hasAttribute('nativeIndex') && Number.isInteger(nativeIndex) && nativeIndex >= 0 ? 1 : 0) + (element.getAttribute('asset') ? 1 : 0) + (element.getAttribute('provider') ? 1 : 0);
      if (backingCount !== 1) add(element, 'Thumbnail definitions require exactly one native index, packaged asset or provider');
    }
    if (element.tagName === 'soundDefinition' && (!element.hasAttribute('nativeIndex') || !Number.isInteger(Number(element.getAttribute('nativeIndex'))) || Number(element.getAttribute('nativeIndex')) <= 0))
      add(element, 'Sound definitions require a positive integer native index');
    if (element.tagName === 'battleStageDefinition' && (!element.hasAttribute('nativeIndex') || !Number.isInteger(Number(element.getAttribute('nativeIndex'))) || Number(element.getAttribute('nativeIndex')) < -1))
      add(element, 'Battle-stage definitions require an integer native index of -1 or greater');
    if (element.tagName === 'serviceDefinition' && !element.getAttribute('label')) add(element, 'Service definitions require a display label');
    if (element.tagName === 'serviceDefinition' && element.hasAttribute('legacyBit')) {
      const legacyBit = Number(element.getAttribute('legacyBit'));
      if (!Number.isInteger(legacyBit) || legacyBit < 0 || legacyBit >= 31) add(element, 'Service native bit must be an integer from 0 through 30');
    }
    if (
      element.tagName === 'submapDestination' &&
      (!element.hasAttribute('cut') || !element.getAttribute('cut').trim() || !Number.isInteger(Number(element.getAttribute('cut'))) || !element.hasAttribute('scene') || !element.getAttribute('scene').trim() || !Number.isInteger(Number(element.getAttribute('scene'))))
    )
      add(element, 'Submap destinations require integer cut and scene numbers');
    if (element.tagName === 'assets' || element.tagName === 'thumbnail' || element.tagName === 'thumbnailDefinition' || element.tagName === 'resources') {
      const paths = [
        element.getAttribute('model'),
        element.getAttribute('texture'),
        element.getAttribute('asset'),
        element.getAttribute('background'),
        ...Array.from(element.querySelectorAll('locationSoundFiles')).flatMap((e) => ['header', 'indices', 'sequence', 'bank'].map((name) => e.getAttribute(name))),
        ...Array.from(element.querySelectorAll('leader, transports > item')).flatMap((e) => [e.getAttribute('model'), e.getAttribute('texture')]),
        ...Array.from(element.querySelectorAll('uiTextures > item, transportTextures > item')).map((e) => e.getAttribute('value')),
        ...Array.from(element.querySelectorAll('textures > item, animations > item')).map((e) => e.getAttribute('value')),
      ].filter(Boolean);
      for (const path of paths) {
        if (/[\\:\0]/.test(path) || path.startsWith('/') || path.split('/').some((p) => p === '.' || p === '..' || !p)) add(element, `Unsafe asset path: ${path}`);
        else if (!assetPaths.includes(path.replaceAll('\\', '/'))) add(element, `Asset not attached: ${path}`, 'warning');
      }
    }
  }
  return result;
}

export function childTemplate(parent: Element, name?: string): string {
  const tag = name || 'item';
  if (['presentationProfile', 'layout'].includes(parent.tagName)) {
    if (name === 'capabilities') return '<capabilities retailLabels="false" retailWater="false" retailAvatars="false"/>';
    if (['namedElements', 'namedTextures', 'mapPositions', 'regions', 'services', 'waterClutYs', 'playerAvatarVramSlots', 'textureAdjustments'].includes(name)) return `<${name}/>`;
  }
  if (parent.tagName === 'namedElements') return '<item id="custom:element" label="New element"><position x="0" y="0" z="0"/></item>';
  if (parent.tagName === 'namedTextures') return '<item id="custom:texture"><adjustment index="0" clutX="0" clutY="0" tpageX="0" tpageY="0" mode="NONE"/></item>';
  if (name === 'scene') return `<scene><translation ${POINT}/><xAxis x="1" y="0" z="0"/><yAxis x="0" y="1" z="0"/><zAxis x="0" y="0" z="1"/></scene>`;
  if (name === 'resources') return '<resources/>';
  if (name === 'locationSoundFiles') return '<locationSoundFiles header="" indices="" sequence="" bank=""/>';
  if (name === 'data') return '<data type="map"/>';
  if (parent.tagName === 'data' || parent.tagName === 'entry') return parent.getAttribute('type') === 'map' ? '<entry key="newKey" type="string" value=""/>' : '<entry type="string" value=""/>';
  if (name === 'layout') return TEMPLATES['presentationProfile'].replaceAll('presentationProfile', 'layout');
  if (name === 'leader') return '<leader model="" texture=""><animations><item value=""/><item value=""/><item value=""/></animations></leader>';
  if (name === 'transports') return '<transports>' + '<item model=""><animations><item value=""/></animations></item>'.repeat(3) + '</transports>';
  if (name === 'transportTextures') return '<transportTextures><item value=""/><item value=""/><item value=""/></transportTextures>';
  if (name === 'uiTextures') return '<uiTextures/>';
  if (['uiTextures', 'transportTextures'].includes(parent.tagName)) return '<item value=""/>';
  if (parent.tagName === 'transports') return '<item model=""><animations><item value=""/></animations></item>';
  if (parent.tagName === 'camera' && tag === 'lighting') return '<lighting overviewBrightness="0.125" transitionBrightness="0.25" transitionStep="0.140625"><ambient x="0.375" y="0.375" z="0.375"/><lights><item><direction x="0.24414062" y="0.024414062" z="0"/><colour x="0.125" y="0.125" z="0.125"/></item><item><direction x="0.24414062" y="0.024414062" z="0"/><colour x="0.125" y="0.125" z="0.125"/></item><item><direction x="0.24414062" y="0.024414062" z="0"/><colour x="0.125" y="0.125" z="0.125"/></item></lights></lighting>';
  if (parent.tagName === 'encounterPool' && tag === 'percentages') return '<percentages><item value="35"/><item value="35"/><item value="20"/><item value="10"/></percentages>';
  if (name && ['position', 'translation', 'viewpoint', 'refpoint', 'overviewPosition', 'minimum', 'maximum', 'visualOffset', 'scale'].includes(name)) return `<${name} ${POINT}/>`;
  if (name === 'assets')
    return parent.tagName === 'avatar'
      ? `<assets model="" shadowScale="1" idleAnimation="0" walkAnimation="1" runAnimation="2" textureSlot="0"><scale x="1" y="1" z="1"/><animations/></assets>`
      : '<assets model="" retailAnimations="false"><textures/></assets>';
  if (name === 'serviceIds' || name === 'soundIds') return `<${name}/>`;
  const p = parent.tagName;
  if (['points', 'mapPositions'].includes(p)) return `<item ${POINT}/>`;
  if (['enabledPortals', 'routes', 'encounters', 'serviceIds', 'soundIds'].includes(p)) return '<item id=""/>';
  if (p === 'markers') return '<item id="custom:marker" progress="0.5"/>';
  if (p === 'warps') return '<item phase="TICK" target="" respectAccess="true"/>';
  if (p === 'textureAdjustments') return '<item index="0" clutX="0" clutY="0" tpageX="0" tpageY="0" mode="NORMAL"/>';
  if (p === 'capabilities') return '<capability id="COOLON" allowed="true"/>';
  if (p === 'portals' && parent.parentElement?.tagName === 'rules') return '<portal id="" code="ALLOWED" reason=""/>';
  return `<${tag} value="0"/>`;
}
