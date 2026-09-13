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
  geometry: `<geometry legacyIndex="-1"><points><item ${POINT}/><item x="100" y="0" z="0"/></points></geometry>`,
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
  presentationProfile: '<presentationProfile><mapPositions/><regions/><services/><waterClutYs/><playerAvatarVramSlots/><textureAdjustments/></presentationProfile>',
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
  place: ['name', 'thumbnailId'],
  route: ['encounterPool', 'avatar', 'battleStageId'],
  portal: ['route', 'place', 'region', 'fromId', 'toId', 'atmosphere', 'smoke'],
  thumbnailDefinition: ['asset', 'provider', 'label'],
  serviceDefinition: ['legacyBit'],
  soundDefinition: ['label'],
  battleStageDefinition: ['label'],
  submapDestination: ['label'],
  storyPreset: ['place'],
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

export function referenceSection(element: Element, attribute: string): string | undefined {
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
  const registryIds = new Map(Object.keys(SECTIONS).map((section) => [section, new Set([...entries(doc, section).map((entry) => entry.getAttribute('id')), ...(nativeRegistry[section] || [])])]));
  const removedIds = new Set(entries(doc, 'removals').map((entry) => `${entry.getAttribute('kind')}:${entry.getAttribute('id')}`));
  const add = (element: Element, message: string, severity: 'error' | 'warning' = 'error') => {
    if (!result.some((issue) => issue.message === message)) result.push({ element, message, severity });
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
    for (const attribute of Array.from(element.attributes)) {
      const target = referenceSection(element, attribute.name);
      if (target && attribute.value && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(attribute.value)) add(element, `${attribute.name} must use namespace:entry syntax`);
      const removed = target && removedIds.has(`${target}:${attribute.value}`);
      if (removed && element.tagName !== 'remove') add(element, `${attribute.name}: ${attribute.value} refers to a removed ${target} entry`);
      else if (target && element.tagName !== 'remove' && !registryIds.get(target)?.has(attribute.value)) {
        add(element, `${attribute.name}: ${attribute.value || '(empty)'} is not in this file; an installed mod must provide it`, attribute.value ? 'warning' : 'error');
      }
      const presentation = fieldPresentation(element, attribute.name);
      if (presentation.numeric && (!attribute.value.trim() || !Number.isFinite(Number(attribute.value)))) add(element, `${attribute.name} must be a finite number`);
      else if (presentation.integer && !Number.isInteger(Number(attribute.value))) add(element, `${attribute.name} must be an integer`);
    }
    if (element.tagName === 'geometry' && element.hasAttribute('id') && element.querySelectorAll('points > item').length < 2) add(element, 'Geometry needs at least two points');
    if (element.tagName === 'encounterPool' && element.querySelectorAll('encounters > item').length !== 4) add(element, 'Encounter pools require exactly four encounter IDs');
    if (element.tagName === 'camera' && Boolean(element.querySelector('minimum')) !== Boolean(element.querySelector('maximum')))
      add(element, 'Camera minimum and maximum bounds must be supplied together');
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
    if (element.tagName === 'assets' || element.tagName === 'thumbnail' || element.tagName === 'thumbnailDefinition') {
      const paths = [
        element.getAttribute('model'),
        element.getAttribute('texture'),
        element.getAttribute('asset'),
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
