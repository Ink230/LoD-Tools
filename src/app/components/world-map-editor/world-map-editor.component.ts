import { SEARCH_PREFIXES, WorldMapCommandComponent } from './world-map-command.component';
import { WorldMapControlsComponent } from './world-map-controls.component';
import { KEY_ACTIONS, KeyAction, WorldMapKeybindings } from './world-map-keybindings';
import { authorNumber } from './world-map-number';
import { WorldMapConfigComponent } from './world-map-config.component';
import { splitJunction } from './world-map-junction';
import { WORLD_MAP_THEME_COLORS } from './world-map-theme';
import { WorldMapTerrainComponent } from './world-map-terrain.component';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject, OnInit, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorldMapInspectorComponent } from './world-map-inspector.component';
import { WorldMapCanvasComponent } from './world-map-canvas.component';
import { WorldMapDocumentPanelsComponent } from './world-map-document-panels.component';
import { Diagnostic, diagnostics, entries, parsePreset, referenceSection, SECTIONS, serializePreset, TEMPLATES } from './world-map-document';
import { readPackage, safeAssetPath, writePackage } from './world-map-package';
import { NATIVE_REGISTRY } from './world-map-registry';
import { graphCoordinates, synchronizeGraph } from './world-map-graph';
import { orientPoint } from './world-map-view';

interface MapNode {
  element: Element;
  id: string;
  x: number;
  z: number;
}
interface MapRoute {
  element: Element;
  id: string;
  geometry?: Element;
  points: string;
  start?: MapNode;
  end?: MapNode;
}
interface PointHandle {
  element: Element;
  x: number;
  z: number;
  index: number;
}
interface EditorSnapshot {
  source: string;
  assets: Map<string, Uint8Array>;
  filename: string;
}

@Component({
  selector: 'app-world-map-editor',
  host: { '[class.viewport-host]': 'fillViewport', '[style.--wmap-hue-shift]': 'theme.shift', '[style]': 'themeColors' },
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [WorldMapCommandComponent, WorldMapControlsComponent, WorldMapConfigComponent, WorldMapTerrainComponent, FormsModule, WorldMapInspectorComponent, WorldMapCanvasComponent, WorldMapDocumentPanelsComponent],
  templateUrl: './world-map-editor.component.html',
  styleUrls: ['./world-map-editor.component.css', './world-map-viewport.css'],
})
export class WorldMapEditorComponent implements OnInit {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  doc = parsePreset('<worldMapPreset version="1" id="custom:world_map" name="Untitled world map" description=""/>');
  fillViewport = true;
  headerCollapsed = false;
  includeStoryRefs = false;
  toggleStoryRefs() {
    this.includeStoryRefs = !this.includeStoryRefs;
    try { localStorage.setItem('lodtools.world-map.include-story-refs', String(this.includeStoryRefs)); } catch { /* Filtering still works without browser storage. */ }
  }
  readonly themeColors = WORLD_MAP_THEME_COLORS;
  readonly themes = [
    { name: 'Green', shift: 0, color: '#a4d77b' },
    { name: 'Purple', shift: 180, color: '#cb9de8' },
    { name: 'Red', shift: 250, color: '#ee9696' },
    { name: 'Orange', shift: 280, color: '#edb17c' },
    { name: 'Blue', shift: 110, color: '#91b8ef' },
  ];
  toggleHeader() {
    this.headerCollapsed = !this.headerCollapsed;
    try { localStorage.setItem('lodtools.world-map.header-collapsed', String(this.headerCollapsed)); } catch { /* Header still works without browser storage. */ }
  }
  themeIndex = 0;
  get theme() { return this.themes[this.themeIndex]; }
  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % this.themes.length;
    try { localStorage.setItem('lodtools.world-map.theme', this.theme.name); } catch { /* Theme still works without browser storage. */ }
  }
  section = 'nodes';
  sections = Object.keys(SECTIONS);
  contentGroups = [
    { title: 'World Primitives', sections: ['nodes', 'geometry', 'routes', 'places', 'portals', 'teleportLinks', 'coolonDestinations', 'regions'] },
    { title: 'Story', sections: ['storyPresets', 'behaviours', 'rules', 'traversalProfiles', 'presentationProfiles'] },
    { title: 'Assets', sections: ['avatars', 'thumbnails', 'thumbnailDefinitions'] },
    { title: 'Data', sections: ['battleStageDefinitions', 'encounterPools', 'soundDefinitions', 'serviceDefinitions', 'submapDestinations'] },
    { title: 'Preset', sections: ['requiredMods', 'removals'] },
  ];
  selected: Element | null = null;
  search = '';
  region = '';
  mode: 'select' | 'node' | 'point' | 'junction' | 'drawGeometry' | 'coolon' | 'portalView' | 'placeView' = 'select';
  tab: 'map' | 'source' | 'assets' = 'map';
  filename = 'world-map.wmap';
  status = 'Load the vanilla preset or import a .wmap to begin';
  error = '';
  private documentSource = serializePreset(this.doc);
  source = this.documentSource;
  assets = new Map<string, Uint8Array>();
  undoStack: EditorSnapshot[] = [];
  redoStack: EditorSnapshot[] = [];
  nodes: MapNode[] = [];
  nodeNames = new Map<string, string>();
  nodePlaces = new Map<string, Element>();
  routes: MapRoute[] = [];
  registry: Record<string, string[]> = {};
  registryLabels: Record<string, Record<string, string>> = {};
  private nativeRegistry: Record<string, string[]> = Object.fromEntries(Object.entries(NATIVE_REGISTRY).map(([section, ids]) => [section, [...ids]]));
  private nativeRegistryLabels: Record<string, Record<string, string>> = {};
  issues: Diagnostic[] = [];
  view = { x: -500, z: -350, width: 1000, height: 700 };
  showLabels = true;
  labelMenuOpen = false;
  readonly labelKinds = ['places', 'nodes', 'routes', 'portals', 'geometry', 'coolonDestinations'] as const;
  activeLabels = { places: true, nodes: true, routes: false, portals: false, geometry: false, coolonDestinations: true };
  mapNodeLabel(id: string) {
    if (this.activeLabels.places && this.nodePlaces.has(id)) return this.nodeName(id);
    return this.activeLabels.nodes ? this.shortId(id) : '';
  }
  get coolonMarkers() {
    const portals = new Map(entries(this.doc, 'portals').map((portal) => [portal.getAttribute('id'), portal]));
    const routes = new Map(this.filteredRoutes.map((route) => [route.id, route]));
    return entries(this.doc, 'coolonDestinations').flatMap((element) => {
      const portal = portals.get(element.getAttribute('portal'));
      if (!portal || (this.region && !this.entryRegions(portal, 'portals').has(this.region))) return [];
      const node = routes.get(portal.getAttribute('route'))?.start;
      return node ? [{ element, section: 'coolonDestinations', x: node.x, z: node.z, text: (element.getAttribute('label') || this.shortId(element.getAttribute('id'))).replaceAll('\n', ' ') }] : [];
    });
  }
  get extraMapLabels() {
    const result: { element: Element; section: string; text: string; x: number; z: number; offset: number }[] = [];
    const geometrySeen = new Set<string>();
    for (const route of this.filteredRoutes) {
      const points = route.points.trim().split(/\s+/).filter(Boolean);
      const middle = points[Math.floor(points.length / 2)]?.split(',').map(Number);
      if (!middle) continue;
      if (this.activeLabels.routes) result.push({ element: route.element, section: 'routes', text: this.shortId(route.id), x: middle[0], z: middle[1], offset: -8 });
      const geometry = route.geometry;
      if (this.activeLabels.geometry && geometry && !geometrySeen.has(geometry.getAttribute('id'))) {
        geometrySeen.add(geometry.getAttribute('id'));
        result.push({ element: geometry, section: 'geometry', text: this.shortId(geometry.getAttribute('id')), x: middle[0], z: middle[1], offset: 8 });
      }
    }
    if (this.activeLabels.portals) {
      const routes = new Map(this.filteredRoutes.map((route) => [route.id, route]));
      for (const portal of entries(this.doc, 'portals')) {
        const node = routes.get(portal.getAttribute('route'))?.start;
        if (node) result.push({ element: portal, section: 'portals', text: this.shortId(portal.getAttribute('id')), x: node.x, z: node.z, offset: 22 });
      }
    }
    return result;
  }
  showDiagnostics = false;
  pointIndex = -1;
  loading = false;
  drag: { kind: 'pan' | 'node' | 'point'; x: number; z: number; clientX: number; clientY: number; element?: Element; before?: EditorSnapshot } | null = null;

  saveLabelSettings() {
    try {
      localStorage.setItem('lodtools.world-map.labels', JSON.stringify({ visible: this.showLabels, active: this.activeLabels }));
    } catch { /* Labels still work without browser storage. */ }
  }
  private restoreLabelSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem('lodtools.world-map.labels') || 'null');
      if (typeof stored?.visible === 'boolean') this.showLabels = stored.visible;
      for (const kind of this.labelKinds) {
        if (typeof stored?.active?.[kind] === 'boolean') this.activeLabels[kind] = stored.active[kind];
      }
    } catch { /* Keep defaults when storage is unavailable or invalid. */ }
  }
  ngOnInit() {
    this.restoreLabelSettings();
    try {
      const namespace = localStorage.getItem('lodtools.world-map.registry-namespace');
      if (namespace && /^[a-z]+$/.test(namespace)) this.registryNamespace = namespace;
    } catch { /* Use the default namespace. */ }
    try { this.toolsOpen = localStorage.getItem('lodtools.world-map.tools-open') !== 'false'; } catch { /* Default open. */ }
    try {
      this.includeStoryRefs = localStorage.getItem('lodtools.world-map.include-story-refs') === 'true';
      this.headerCollapsed = localStorage.getItem('lodtools.world-map.header-collapsed') === 'true';
      const stored = localStorage.getItem('lodtools.world-map.theme');
      this.themeIndex = Math.max(0, this.themes.findIndex((theme) => theme.name === stored));
    } catch { /* Default to green when browser storage is unavailable. */ }
    this.refresh();
    void this.loadNativeCatalog();
    void this.loadVanilla();
  }
  get root() {
    return this.doc.documentElement;
  }
  get title() {
    return this.root.getAttribute('name') || 'Untitled world map';
  }
  get items() {
    return entries(this.doc, this.section).sort((a, b) => (a.getAttribute('id') || '').localeCompare(b.getAttribute('id') || '', undefined, { numeric: true })).filter((e) => !this.search || (e.getAttribute('id') + ' ' + e.getAttribute('name')).toLowerCase().includes(this.search.toLowerCase()));
  }
  get regions() {
    return entries(this.doc, 'regions');
  }
  entityReferences = new Map<string, { element: Element; section: string; fields: string[] }[]>();
  private locatedEntity?: Element;
  get entityLocatorPoints(): { x: number; z: number }[] {
    if (this.selected !== this.locatedEntity) return [];
    return this.locateEntity(this.selected, this.section);
  }
  get canLocateEntity() { return !!this.selected && this.locateEntity(this.selected, this.section).length > 0; }
  toggleEntityLocator() {
    this.locatedEntity = this.locatedEntity === this.selected ? undefined : this.selected;
  }
  private locateEntity(element: Element, section: string, visited = new Set<Element>()): { x: number; z: number }[] {
    if (!element || visited.has(element)) return [];
    visited.add(element);
    const id = element.getAttribute('id');
    if (section === 'nodes') {
      const node = this.filteredNodes.find(node => node.id === id);
      return node ? [{ x: node.x, z: node.z }] : [];
    }
    if (section === 'routes') {
      const route = this.filteredRoutes.find(route => route.id === id);
      return route?.start ? [{ x: route.start.x, z: route.start.z }] : [];
    }
    if (section === 'portals' || section === 'coolonDestinations' || section === 'teleportLinks') {
      const targetSection = section === 'portals' ? 'routes' : 'portals';
      const targetId = element.getAttribute(section === 'portals' ? 'route' : section === 'coolonDestinations' ? 'portal' : 'source');
      const target = entries(this.doc, targetSection).find(entry => entry.getAttribute('id') === targetId);
      return target ? this.locateEntity(target, targetSection, visited) : [];
    }
    const points = (this.entityReferences.get(`${section}:${id}`) || [])
      .filter(ref => ['routes', 'portals', 'places', 'coolonDestinations'].includes(ref.section))
      .flatMap(ref => this.locateEntity(ref.element, ref.section, visited));
    return points.filter((point, index) => points.findIndex(other => other.x === point.x && other.z === point.z) === index);
  }
  get correspondingRoutes() {
    const geometry = this.section === 'routes' ? this.selected?.getAttribute('geometry') : null;
    return geometry ? entries(this.doc, 'routes').filter((route) => route !== this.selected && route.getAttribute('geometry') === geometry) : [];
  }
  createCorrespondingRoute() {
    if (this.section !== 'routes' || !this.selected || this.correspondingRoutes.length) return;
    const source = this.selected;
    const geometry = source.getAttribute('geometry');
    const start = source.getAttribute('start');
    const end = source.getAttribute('end');
    const direction = Number(source.getAttribute('direction'));
    if (!geometry || !start || !end || ![1, -1].includes(direction)) return;
    this.mutate(() => {
      const route = source.cloneNode(true) as Element;
      let index = 1;
      while (this.registry['routes']?.includes(`${this.registryNamespace}:route_${index}`)) index++;
      route.setAttribute('id', `${this.registryNamespace}:route_${index}`);
      // A new route must not overwrite its source's native slot.
      route.removeAttribute('legacyIndex');
      route.setAttribute('start', end);
      route.setAttribute('end', start);
      route.setAttribute('direction', String(-direction));
      source.parentElement.appendChild(route);
      const region = this.entryRegions(source, 'routes').values().next().value || this.region;
      if (region) this.bindDrawnRouteRegion(route, region);
    });
  }
  private drawingGeometryId?: string;
  private drawingStartId?: string;
  startGeometryDrawing() {
    if (this.mode === 'drawGeometry') { this.finishGeometryDrawing(); return; }
    this.mode = 'drawGeometry';
    this.drawingGeometryId = undefined;
    this.drawingStartId = undefined;
  }
  private drawingId(section: string, kind: string) {
    let index = 1;
    while (entries(this.doc, section).some(entry => entry.getAttribute('id') === `${this.registryNamespace}:${kind}_${index}`)) index++;
    return `${this.registryNamespace}:${kind}_${index}`;
  }
  private appendDrawingEntry(section: string, element: Element) {
    let container = Array.from(this.root.children).find(child => child.tagName === section);
    if (!container) container = this.root.appendChild(this.doc.createElement(section));
    container.appendChild(element);
  }
  drawGeometryPoint(x: number, z: number, node?: Element) {
    let geometry = entries(this.doc, 'geometry').find(entry => entry.getAttribute('id') === this.drawingGeometryId);
    const finish = !!geometry && !!node;
    this.mutate(() => {
      if (!geometry) {
        geometry = this.doc.createElement('geometry');
        geometry.setAttribute('id', this.drawingId('geometry', 'geometry'));
        geometry.appendChild(this.doc.createElement('points'));
        this.appendDrawingEntry('geometry', geometry);
        this.drawingGeometryId = geometry.getAttribute('id');
        this.drawingStartId = node?.getAttribute('id');
      }
      const points = geometry.querySelector('points');
      const point = this.doc.createElement('item');
      const position = node?.querySelector('position');
      point.setAttribute('x', position?.getAttribute('x') || String(authorNumber(x)));
      point.setAttribute('y', position?.getAttribute('y') || points.lastElementChild?.getAttribute('y') || '0');
      point.setAttribute('z', position?.getAttribute('z') || String(authorNumber(z)));
      points.appendChild(point);
      this.selected = geometry;
      this.section = 'geometry';
      this.pointIndex = points.children.length - 1;
    });
    if (finish) this.finishGeometryDrawing(node);
  }
  finishGeometryDrawing(endNode?: Element) {
    if (this.mode !== 'drawGeometry') return;
    const geometry = entries(this.doc, 'geometry').find(entry => entry.getAttribute('id') === this.drawingGeometryId);
    const points = Array.from(geometry?.querySelectorAll('points > item') || []);
    if (geometry && points.length < 2) {
      this.mutate(() => { geometry.remove(); this.selected = null; this.pointIndex = -1; });
      this.status = 'Geometry needs two points; the unfinished point was discarded.';
    } else if (geometry && endNode) {
      this.mutate(() => {
        let start = entries(this.doc, 'nodes').find(entry => entry.getAttribute('id') === this.drawingStartId);
        start ||= entries(this.doc, 'nodes').find(entry => entry.querySelector('position') && ['x', 'y', 'z'].every(axis => Number(entry.querySelector('position').getAttribute(axis)) === Number(points[0].getAttribute(axis))));
        if (!start) {
          start = this.doc.createElement('node');
          start.setAttribute('id', this.drawingId('nodes', 'node'));
          const position = start.appendChild(this.doc.createElement('position'));
          for (const axis of ['x', 'y', 'z']) position.setAttribute(axis, points[0].getAttribute(axis));
          this.appendDrawingEntry('nodes', start);
        } else {
          // The first point may have been dragged after starting at an existing node.
          for (const axis of ['x', 'y', 'z']) points[0].setAttribute(axis, start.querySelector('position').getAttribute(axis));
        }
        const route = this.doc.importNode(new DOMParser().parseFromString(TEMPLATES['route'], 'application/xml').documentElement, true);
        route.setAttribute('id', this.drawingId('routes', 'route'));
        route.setAttribute('geometry', geometry.getAttribute('id'));
        route.setAttribute('start', start.getAttribute('id'));
        route.setAttribute('end', endNode.getAttribute('id'));
        this.appendDrawingEntry('routes', route);
        const region = this.region || this.entryRegions(endNode, 'nodes').values().next().value;
        if (region) this.bindDrawnRouteRegion(route, region);
        this.selected = route;
        this.section = 'routes';
        this.pointIndex = -1;
      });
    }
    this.mode = 'select';
    this.drawingGeometryId = undefined;
    this.drawingStartId = undefined;
  }
  private bindDrawnRouteRegion(route: Element, region: string) {
    const place = this.doc.createElement('place');
    place.setAttribute('id', this.drawingId('places', 'junction_place'));
    place.setAttribute('services', '0');
    place.setAttribute('thumbnail', '0');
    this.appendDrawingEntry('places', place);
    const portal = this.doc.importNode(new DOMParser().parseFromString(TEMPLATES['portal'], 'application/xml').documentElement, true);
    portal.setAttribute('id', this.drawingId('portals', 'junction_portal'));
    portal.setAttribute('route', route.getAttribute('id'));
    portal.setAttribute('place', place.getAttribute('id'));
    portal.setAttribute('region', region);
    const template = this.regions.find(entry => entry.getAttribute('id') === region)?.getAttribute('legacyTemplate');
    if (template) portal.setAttribute('continent', template);
    this.appendDrawingEntry('portals', portal);
  }
  @HostListener('document:pointerdown', ['$event'])
  finishDrawingOutside(event: PointerEvent) {
    if ((event.target as Element)?.closest?.('[data-delete-entity]')) return;
    if (this.mode === 'drawGeometry' && !(event.target as Element)?.closest?.('.canvas-wrap')) this.finishGeometryDrawing();
  }
  controlsOpen = false;
  keybindings = new WorldMapKeybindings();
  registryNamespace = 'custom';
  setRegistryNamespace(value: string) {
    if (!/^[a-z]+$/.test(value)) return;
    this.registryNamespace = value;
    try { localStorage.setItem('lodtools.world-map.registry-namespace', value); } catch { /* Configuration works without storage. */ }
  }
  readonly portalIcon = 'M5 21V9a7 7 0 0 1 14 0v12H5M9 21V9a3 3 0 0 1 6 0v12M14 14h1';
  readonly placeIcon = 'M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13ZM15 9a3 3 0 1 1-6 0a3 3 0 0 1 6 0';
  coolonPortalChoices: Element[] = [];
  togglePlaceView() {
    this.finishGeometryDrawing();
    this.coolonPortalChoices = [];
    this.mode = this.mode === 'placeView' ? 'select' : 'placeView';
  }
  togglePortalView() {
    this.finishGeometryDrawing();
    this.coolonPortalChoices = [];
    this.mode = this.mode === 'portalView' ? 'select' : 'portalView';
  }
  pickPortalMarker(portal: Element) {
    if (this.mode === 'placeView') {
      this.goToEntry({ element: portal, section: 'places' });
      this.coolonPortalChoices = [];
    } else if (this.mode === 'portalView') {
      this.goToEntry({ element: portal, section: 'portals' });
      this.coolonPortalChoices = [];
    } else this.createCoolonAtPortal(portal);
  }
  toggleCoolonTool() {
    this.finishGeometryDrawing();
    this.coolonPortalChoices = [];
    this.mode = this.mode === 'coolon' ? 'select' : 'coolon';
  }
  private portalMarkerCache?: { region: string; mode: string; markers: { x: number; z: number; portals: Element[]; label: string }[] };
  get coolonCreationMarkers() {
    if (this.mode !== 'coolon' && this.mode !== 'portalView' && this.mode !== 'placeView') return [];
    if (this.portalMarkerCache?.region === this.region && this.portalMarkerCache.mode === this.mode) return this.portalMarkerCache.markers;
    const markers = this.buildPortalMarkers();
    this.portalMarkerCache = { region: this.region, mode: this.mode, markers };
    return markers;
  }
  private buildPortalMarkers() {
    if (this.mode !== 'coolon' && this.mode !== 'portalView' && this.mode !== 'placeView') return [];
    const groups = new Map<string, { x: number; z: number; portals: Element[] }>();
    const routes = new Map(this.filteredRoutes.map(route => [route.id, route]));
    const places = new Map(entries(this.doc, 'places').map(place => [place.getAttribute('id'), place]));
    for (const portal of entries(this.doc, 'portals')) {
      if (this.region && !this.entryRegions(portal, 'portals').has(this.region)) continue;
      const route = routes.get(portal.getAttribute('route'));
      if (!route?.start || (this.mode === 'placeView' && !portal.getAttribute('place'))) continue;
      const key = `${route.start.x}:${route.start.z}`;
      if (!groups.has(key)) groups.set(key, { x: route.start.x, z: route.start.z, portals: [] });
      groups.get(key).portals.push(portal);
    }
    return [...groups.values()].map(marker => ({ ...marker, label: places.get(marker.portals[0].getAttribute('place'))?.getAttribute('name') || marker.portals[0].getAttribute('id') }));
  }
  chooseCoolonPortal(portals: Element[]) {
    if (this.mode === 'placeView') {
      portals = [...new Set(portals.map(portal => entries(this.doc, 'places').find(place => place.getAttribute('id') === portal.getAttribute('place'))).filter(Boolean))];
    }
    if (portals.length === 1) this.pickPortalMarker(portals[0]);
    else this.coolonPortalChoices = portals;
  }
  coolonPortalLabel(portal: Element) {
    if (portal.tagName === 'place') return portal.getAttribute('name') || portal.getAttribute('id');
    const place = entries(this.doc, 'places').find(place => place.getAttribute('id') === portal.getAttribute('place'));
    return place?.getAttribute('name') || portal.getAttribute('id');
  }
  private inferCoolonPlacement(portal: Element, x: number, z: number) {
    const regions = this.entryRegions(portal, 'portals');
    const anchors = entries(this.doc, 'coolonDestinations').flatMap(destination => {
      const linked = entries(this.doc, 'portals').find(entry => entry.getAttribute('id') === destination.getAttribute('portal'));
      if (!linked || ![...this.entryRegions(linked, 'portals')].some(region => regions.has(region))) return [];
      const node = this.routes.find(route => route.id === linked.getAttribute('route'))?.start;
      if (!node) return [];
      const distance = (node.x - x) ** 2 + (node.z - z) ** 2;
      return [{ destination, distance: linked === portal ? 0 : distance }];
    }).sort((a, b) => a.distance - b.distance).slice(0, 3);
    if (!anchors.length) return undefined;
    const closest = anchors[0];
    const selected = closest.distance < 0.000001 ? [closest] : anchors;
    const weights = selected.map(anchor => 1 / Math.max(anchor.distance, 0.000001));
    const total = weights.reduce((sum, value) => sum + value, 0);
    const average = (field: string, position = false) => authorNumber(selected.reduce((sum, anchor, i) => sum + weights[i] * this.number(position ? anchor.destination.querySelector('position') : anchor.destination, field), 0) / total);
    return { x: Math.round(average('x')), y: Math.round(average('y')), position: ['x', 'y', 'z'].map(axis => average(axis, true)) };
  }
  createCoolonAtPortal(portal: Element) {
    const route = this.routes.find(route => route.id === portal.getAttribute('route'));
    if (!route?.start) return;
    const placement = this.inferCoolonPlacement(portal, route.start.x, route.start.z);
    this.mutate(() => {
      const destination = this.doc.importNode(new DOMParser().parseFromString(TEMPLATES['coolonDestination'], 'application/xml').documentElement, true);
      const id = this.drawingId('coolonDestinations', 'coolon_destination');
      destination.setAttribute('id', id);
      destination.setAttribute('portal', portal.getAttribute('id'));
      const existing = entries(this.doc, 'coolonDestinations');
      destination.setAttribute('order', String(Math.max(-1, ...existing.map(entry => this.number(entry, 'order'))) + 1));
      destination.setAttribute('defaultDestination', existing[0]?.getAttribute('id') || id);
      destination.setAttribute('label', this.coolonPortalLabel(portal));
      destination.setAttribute('worldMapArrival', 'true');
      const source = route.start.element.querySelector('position');
      for (const axis of ['x', 'y', 'z']) destination.querySelector('position').setAttribute(axis, source.getAttribute(axis));
      if (placement) {
        destination.setAttribute('x', String(placement.x));
        destination.setAttribute('y', String(placement.y));
        ['x', 'y', 'z'].forEach((axis, i) => destination.querySelector('position').setAttribute(axis, String(placement.position[i])));
      }
      this.appendDrawingEntry('coolonDestinations', destination);
      this.select(destination, 'coolonDestinations');
      this.search = '';
    });
    this.coolonPortalChoices = [];
    this.mode = 'select';
  }
  toolsOpen = true;
  toggleJunctionTool() {
    this.finishGeometryDrawing();
    this.mode = this.mode === 'junction' ? 'select' : 'junction';
  }
  toggleTools() {
    this.finishGeometryDrawing();
    this.toolsOpen = !this.toolsOpen;
    if (!this.toolsOpen && (this.mode === 'junction' || this.mode === 'coolon' || this.mode === 'portalView' || this.mode === 'placeView')) this.mode = 'select';
    try { localStorage.setItem('lodtools.world-map.tools-open', String(this.toolsOpen)); } catch { /* Tools work without storage. */ }
  }
  clickMapRoute(route: Element, event: MouseEvent, map: HTMLElement | SVGSVGElement) {
    if (this.mode === 'drawGeometry') {
      if (event.ctrlKey) this.finishGeometryDrawing();
      else {
        const point = this.coordinates(event, map);
        this.drawGeometryPoint(point.x, point.z);
      }
      return;
    }
    if (this.mode !== 'junction') {
      this.selectMapRoute(route);
      return;
    }
    const point = this.coordinates(event, map);
    try {
      this.mutate(() => {
        this.selected = splitJunction(this.doc, route, point.x, point.z, this.registryNamespace);
        this.section = 'nodes';
        this.pointIndex = -1;
      });
      this.mode = 'select';
      this.error = '';
    } catch (error) { this.error = String(error); }
  }
  selectMapRoute(route: Element) {
    const geometry = route.getAttribute('geometry');
    if (geometry && this.section === 'routes' && this.selected?.getAttribute('geometry') === geometry) {
      const routes = entries(this.doc, 'routes').filter((entry) => entry.getAttribute('geometry') === geometry);
      const index = routes.indexOf(this.selected);
      this.select(routes[(index + 1) % routes.length], 'routes');
      return;
    }
    this.select(route, 'routes');
  }
  get selectedReferences() {
    const id = this.selected?.getAttribute('id');
    return id ? (this.entityReferences.get(`${this.section}:${id}`) || []).filter((reference) => reference.element !== this.selected && (this.includeStoryRefs || reference.section !== 'storyPresets')) : [];
  }
  get assetEntries() {
    return Array.from(this.assets.entries());
  }
  get viewBox() {
    const a = orientPoint(this.view.x, this.view.z, this.orientation);
    const b = orientPoint(this.view.x + this.view.width, this.view.z + this.view.height, this.orientation);
        const center = orientPoint(this.view.x + this.view.width / 2, this.view.z + this.view.height / 2, this.rotationTurns);
    const width = Math.abs(b.x - a.x);
    const height = Math.abs(b.z - a.z);
    return `${center.x - width / 2} ${center.z - height / 2} ${width} ${height}`;
  }
  orientation = 0;
  stageRotation = 0;
  private rotationDrag: { x: number; radius: number; cx: number; cy: number } | null = null;
  get rotationTurns() { return this.orientation + this.stageRotation / 90; }
  readonly orientations = ['North', 'East', 'South', 'West'];
  get mapTransform() {
    return `rotate(${-this.rotationTurns * 90}) scale(1 -1)`;
  }
  labelTransform(x: number, z: number) {
    return `translate(${x} ${z}) ${this.mapTransform} translate(${-x} ${-z})`;
  }
  get unit() {
    return this.view.width / 1000;
  }
  get selectedGeometry(): Element | undefined {
    if (this.selected?.tagName === 'geometry') return this.selected;
    if (this.selected?.tagName === 'route') return entries(this.doc, 'geometry').find((g) => g.getAttribute('id') === this.selected.getAttribute('geometry'));
    return undefined;
  }
  get handles(): PointHandle[] {
    return Array.from(this.selectedGeometry?.querySelectorAll('points > item') || []).map((e, index) => ({ element: e, index, x: this.number(e, 'x'), z: this.number(e, 'z') }));
  }
  get pointElement() {
    return this.handles[this.pointIndex]?.element;
  }
  get geometryPoints() {
    return this.handles.map((p) => `${p.x},${p.z}`).join(' ');
  }
  get filteredRoutes() {
    if (!this.region) return this.routes;
    const routeIds = new Set(
      entries(this.doc, 'portals')
        .filter(
          (p) =>
            p.getAttribute('region') === this.region ||
            (!p.hasAttribute('region') && p.getAttribute('continent') === this.regions.find((r) => r.getAttribute('id') === this.region)?.getAttribute('legacyTemplate'))
        )
        .map((p) => p.getAttribute('route'))
    );
    return this.routes.filter((r) => routeIds.has(r.id));
  }
  get filteredNodes() {
    if (!this.region) return this.nodes;
    const ids = new Set(this.filteredRoutes.flatMap((r) => [r.start?.id, r.end?.id]));
    return this.nodes.filter((n) => ids.has(n.id) || !this.entryRegions(n.element, 'nodes').size);
  }
  label(value: string) {
    const names: Record<string, string> = { battleStageDefinitions: 'Battle Stage', soundDefinitions: 'Sounds', serviceDefinitions: 'Services', submapDestinations: 'Submaps' };
    if (names[value]) return names[value];
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  }
  shortId(value: string) {
    return value?.split(':').pop() || 'Unnamed';
  }
  nodeName(id: string): string {
    return this.nodeNames.get(id) || this.shortId(id);
  }
  entryLabel(element: Element): string {
    if (this.section === 'nodes') return this.nodeName(element.getAttribute('id'));
    return element.getAttribute('label') || element.getAttribute('name') || this.shortId(element.getAttribute('id'));
  }
  selectMapLabel(id: string) {
    const place = this.activeLabels.places ? this.nodePlaces.get(id) : undefined;
    if (place) this.select(place, 'places');
    else {
      const node = this.nodes.find((entry) => entry.id === id);
      if (node) this.select(node.element, 'nodes');
    }
  }
  number(element: Element, attribute: string) {
    const value = Number(element?.getAttribute(attribute));
    return Number.isFinite(value) ? value : 0;
  }
  count(section: string) {
    return entries(this.doc, section).length;
  }
  refresh() {
    this.portalMarkerCache = undefined;
    this.nodeNames.clear();
    this.nodePlaces.clear();
    const routeEntries = new Map(entries(this.doc, 'routes').map((route) => [route.getAttribute('id'), route]));
    const placeEntries = new Map(entries(this.doc, 'places').map((place) => [place.getAttribute('id'), place]));
    for (const portal of entries(this.doc, 'portals')) {
      const node = routeEntries.get(portal.getAttribute('route'))?.getAttribute('start');
      const place = placeEntries.get(portal.getAttribute('place'));
      const name = place?.getAttribute('name');
      if (node && name && !this.nodeNames.has(node)) {
        this.nodeNames.set(node, name.replaceAll('\n', ' '));
        this.nodePlaces.set(node, place);
      }
    }
    this.registry = Object.fromEntries(
      this.sections.map((s) => [
        s,
        entries(this.doc, s)
          .map((e) => e.getAttribute('id'))
          .filter(Boolean),
      ])
    );
    this.registryLabels = Object.fromEntries(Object.entries(this.nativeRegistryLabels).map(([section, labels]) => [section, { ...labels }]));
    for (const section of this.sections) {
      this.registryLabels[section] ||= {};
      for (const entry of entries(this.doc, section)) {
        const id = entry.getAttribute('id');
        const label = entry.getAttribute('label') || entry.getAttribute('name');
        if (id && label) this.registryLabels[section][id] = label;
      }
    }
    for (const [section, ids] of Object.entries(this.nativeRegistry)) this.registry[section] = Array.from(new Set([...(this.registry[section] || []), ...ids]));
    this.registry['assetPaths'] = Array.from(this.assets.keys());
    for (const ids of Object.values(this.registry)) ids.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.nodes = entries(this.doc, 'nodes').map((element) => ({
      element,
      id: element.getAttribute('id'),
      x: this.number(element.querySelector('position'), 'x'),
      z: this.number(element.querySelector('position'), 'z'),
    }));
    this.routes = entries(this.doc, 'routes').map((element) => {
      const geometry = entries(this.doc, 'geometry').find((g) => g.getAttribute('id') === element.getAttribute('geometry'));
      const start = this.nodes.find((n) => n.id === element.getAttribute('start'));
      const end = this.nodes.find((n) => n.id === element.getAttribute('end'));
      let points = Array.from(geometry?.querySelectorAll('points > item') || [])
        .map((p) => `${this.number(p, 'x')},${this.number(p, 'z')}`)
        .join(' ');
      if (!points && start && end) points = `${start.x},${start.z} ${end.x},${end.z}`;
      if (element.getAttribute('direction') === '-1') points = points.split(' ').reverse().join(' ');
      return { element, id: element.getAttribute('id'), geometry, points, start, end };
    });
    this.entityReferences.clear();
    for (const section of this.sections) {
      if (section === 'removals') continue;
      for (const entry of entries(this.doc, section)) {
        const referenced = new Map<string, Set<string>>();
        for (const element of [entry, ...Array.from(entry.querySelectorAll('*'))]) {
          for (const attribute of Array.from(element.attributes)) {
            const target = referenceSection(element, attribute.name);
            if (!target || !attribute.value) continue;
            const key = `${target}:${attribute.value}`;
            if (!referenced.has(key)) referenced.set(key, new Set());
            referenced.get(key).add(element === entry ? attribute.name : `${element.parentElement?.tagName}.${attribute.name}`);
          }
        }
        for (const [id, fields] of referenced) {
          if (!this.entityReferences.has(id)) this.entityReferences.set(id, []);
          this.entityReferences.get(id).push({ element: entry, section, fields: [...fields] });
        }
      }
    }
    this.issues = diagnostics(this.doc, Array.from(this.assets.keys()), this.nativeRegistry);
    this.changeDetector.markForCheck();
  }
  snapshot(): EditorSnapshot {
    return { source: this.documentSource, assets: new Map(this.assets), filename: this.filename };
  }
  mutate(action: () => void) {
    const before = this.snapshot();
    const coordinates = graphCoordinates(this.doc);
    const activeRegion = this.regions.find((entry) => entry.getAttribute('id') === this.region);
    action();
    if (activeRegion?.isConnected) this.region = activeRegion.getAttribute('id') || '';
    synchronizeGraph(this.doc, coordinates);
    this.documentSource = serializePreset(this.doc);
    if (this.tab !== 'source') this.source = this.documentSource;
    if (this.documentSource !== before.source || this.assets.size !== before.assets.size || Array.from(this.assets).some(([key, value]) => before.assets.get(key) !== value)) {
      this.undoStack.push(before);
      this.undoStack = this.undoStack.slice(-80);
      this.redoStack = [];
    }
    this.refresh();
  }
  restore(snapshot: EditorSnapshot) {
    const id = this.selected?.getAttribute('id');
    this.doc = parsePreset(snapshot.source);
    this.assets = new Map(snapshot.assets);
    this.filename = snapshot.filename;
    this.selected = entries(this.doc, this.section).find((e) => e.getAttribute('id') === id) || null;
    this.pointIndex = -1;
    this.refresh();
    this.documentSource = snapshot.source;
    this.source = this.documentSource;
  }
  undo() {
    if (this.undoStack.length) {
      this.redoStack.push(this.snapshot());
      this.restore(this.undoStack.pop());
    }
  }
  redo() {
    if (this.redoStack.length) {
      this.undoStack.push(this.snapshot());
      this.restore(this.redoStack.pop());
    }
  }
  entityBack: { id: string; section: string; region: string }[] = [];
  entityForward: { id: string; section: string; region: string }[] = [];
  private currentEntity() {
    return this.selected ? { id: this.selected.getAttribute('id') || '', section: this.section, region: this.region } : undefined;
  }
  private resolveEntity(target: { id: string; section: string }) {
    return entries(this.doc, target.section).find((entry) => (entry.getAttribute('id') || '') === target.id);
  }
  canNavigateEntity(forward: boolean) {
    return (forward ? this.entityForward : this.entityBack).some((target) => this.resolveEntity(target));
  }
  navigateEntity(forward: boolean) {
    const source = forward ? this.entityForward : this.entityBack;
    const destination = forward ? this.entityBack : this.entityForward;
    while (source.length) {
      const target = source.pop();
      const element = this.resolveEntity(target);
      if (!element) continue;
      const current = this.currentEntity();
      if (current) destination.push(current);
      const previousRegion = this.region;
      const previousView = this.view;
      this.region = this.regions.some((region) => region.getAttribute('id') === target.region) ? target.region : '';
      this.goToEntry({ element, section: target.section }, false);
      if (this.region === previousRegion) this.view = previousView;
      return;
    }
  }
  select(element: Element, section?: string, recordHistory = true) {
    this.locatedEntity = undefined;
    const current = this.currentEntity();
    if (recordHistory && current && (this.selected !== element || this.section !== (section || this.section))) {
      this.entityBack.push(current);
      this.entityForward = [];
    }
    this.selected = element;
    this.pointIndex = -1;
    if (section) this.section = section;
    const regions = this.entryRegions(element, this.section);
    if (regions.size && !regions.has(this.region)) this.region = regions.values().next().value;
  }
  private entryRegions(element: Element, section: string, visited = new Set<Element>()): Set<string> {
    const result = new Set<string>();
    if (visited.has(element)) return result;
    visited.add(element);
    const add = (id: string) => {
      if (this.regions.some((region) => region.getAttribute('id') === id)) result.add(id);
    };
    if (section === 'regions') add(element.getAttribute('id'));
    add(element.getAttribute('region'));
    if (section === 'portals' && !element.hasAttribute('region')) {
      for (const region of this.regions) {
        if (element.hasAttribute('continent') && region.getAttribute('legacyTemplate') === element.getAttribute('continent')) add(region.getAttribute('id'));
      }
    }
    const portalId = section === 'coolonDestinations' ? element.getAttribute('portal') : section === 'teleportLinks' ? element.getAttribute('source') : null;
    if (portalId) {
      const portal = entries(this.doc, 'portals').find((entry) => entry.getAttribute('id') === portalId);
      if (portal) for (const region of this.entryRegions(portal, 'portals', visited)) result.add(region);
    }
    if (result.size) return result;
    // Follow ownership towards spatial entries, never broad story/rule references.
    const owners = this.entityReferences.get(`${section}:${element.getAttribute('id')}`) || [];
    for (const owner of owners) {
      if (!['routes', 'portals', 'places', 'coolonDestinations', 'regions'].includes(owner.section)) continue;
      for (const region of this.entryRegions(owner.element, owner.section, visited)) result.add(region);
    }
    return result;
  }
  goToEntry(target: { element: Element; section: string; point?: Element }, recordHistory = true) {
    this.select(target.element, target.section, recordHistory);
    this.search = '';
    this.tab = 'map';
    const id = target.element.getAttribute('id');
    let route = this.filteredRoutes.find((entry) => target.section === 'routes' ? entry.id === id : target.section === 'geometry' && entry.element.getAttribute('geometry') === id);
    if (target.section === 'portals' || target.section === 'places' || target.section === 'coolonDestinations') {
      const portal = target.section === 'portals' ? target.element : entries(this.doc, 'portals').find((entry) => target.section === 'coolonDestinations' ? entry.getAttribute('id') === target.element.getAttribute('portal') : entry.getAttribute('place') === id);
      route = this.routes.find((entry) => entry.id === portal?.getAttribute('route'));
    }
    const node = target.section === 'nodes' ? this.nodes.find((entry) => entry.id === id) : route?.start;
    if (node) {
      this.view = { ...this.view, x: node.x - this.view.width / 2, z: node.z - this.view.height / 2 };
    }
    if (target.point && target.section === 'geometry') {
      this.pointIndex = this.handles.findIndex((point) => point.element === target.point);
      if (this.pointIndex >= 0) {
        const point = this.handles[this.pointIndex];
        this.view = { ...this.view, x: point.x - this.view.width / 2, z: point.z - this.view.height / 2 };
      }
    }
  }
  changeRegion(region: string) {
    if (this.selected && region) {
      const regions = this.entryRegions(this.selected, this.section);
      const spatial = ['nodes', 'routes', 'geometry', 'portals', 'places', 'coolonDestinations', 'teleportLinks', 'regions'].includes(this.section);
      if (!regions.has(region) && (regions.size || spatial)) {
        const current = this.currentEntity();
        if (current) this.entityBack.push(current);
        this.entityForward = [];
        this.selected = null;
        this.pointIndex = -1;
      }
    }
    this.region = region;
    this.fit();
  }
  chooseSection(section: string) {
    this.search = '';
    const first = entries(this.doc, section)[0];
    if (first) this.select(first, section);
    else {
      this.section = section;
      this.selected = null;
      this.pointIndex = -1;
    }
  }
  createEntry() {
    if (this.section === 'rules' && entries(this.doc, 'rules').length) {
      this.select(entries(this.doc, 'rules')[0]);
      return;
    }
    this.mutate(() => {
      const tag = SECTIONS[this.section];
      const element = this.doc.importNode(new DOMParser().parseFromString(TEMPLATES[tag], 'application/xml').documentElement, true);
      if (tag !== 'rules') {
        const entryName = tag.replace(/[A-Z]/g, (character) => '_' + character.toLowerCase());
        let index = 1;
        while (this.registry[this.section]?.includes(`${this.registryNamespace}:${entryName}_${index}`)) index++;
        element.setAttribute('id', tag === 'mod' ? this.registryNamespace : `${this.registryNamespace}:${entryName}_${index}`);
      }
      if (tag === 'node') {
        const position = element.querySelector('position');
        position.setAttribute('x', String(authorNumber(this.view.x + this.view.width / 2)));
        position.setAttribute('z', String(authorNumber(this.view.z + this.view.height / 2)));
      }
      let container = Array.from(this.root.children).find((e) => e.tagName === this.section);
      if (this.section === 'rules') this.root.appendChild(element);
      else {
        if (!container) {
          container = this.doc.createElement(this.section);
          this.root.appendChild(container);
        }
        container.appendChild(element);
      }
      this.selected = element;
      this.pointIndex = -1;
    });
  }
  deleteSelected(entity = true) {
    if (!entity && this.pointElement) {
      this.removePoint();
      return;
    }
    if (!this.selected) return;
    if (this.selected.tagName === 'portal' && this.selected.hasAttribute('legacyIndex') && this.number(this.selected, 'legacyIndex') >= 0 && this.number(this.selected, 'legacyIndex') < 256) {
      this.error = 'Native portal slots 0–255 are reserved. Their entries can be edited but not removed.';
      return;
    }
    this.mutate(() => {
      const id = this.selected.getAttribute('id');
      if (this.nativeRegistry[this.section]?.includes(id) && ['nodes', 'geometry', 'routes', 'places', 'portals'].includes(this.section)) {
        let removals = Array.from(this.root.children).find((e) => e.tagName === 'removals');
        if (!removals) {
          removals = this.doc.createElement('removals');
          this.root.appendChild(removals);
        }
        const removal = this.doc.createElement('remove');
        removal.setAttribute('kind', this.section);
        removal.setAttribute('id', id);
        removals.appendChild(removal);
      }
      if (this.selected.getAttribute('id') === this.drawingGeometryId) {
        this.mode = 'select';
        this.drawingGeometryId = undefined;
        this.drawingStartId = undefined;
      }
      this.pointIndex = -1;
      this.selected.remove();
      this.selected = null;
    });
  }
  addRoute() {
    this.section = 'routes';
    this.createEntry();
    this.status = 'Choose start, end and geometry registry IDs in the inspector';
  }
  fit() {
    const points = [
      ...this.filteredNodes,
      ...this.filteredRoutes.flatMap((r) => Array.from(r.geometry?.querySelectorAll('points > item') || []).map((p) => ({ x: this.number(p, 'x'), z: this.number(p, 'z') }))),
    ];
    if (!points.length) {
      this.view = { x: -500, z: -350, width: 1000, height: 700 };
      return;
    }
    const minX = Math.min(...points.map((p) => p.x)),
      maxX = Math.max(...points.map((p) => p.x));
    const minZ = Math.min(...points.map((p) => p.z)),
      maxZ = Math.max(...points.map((p) => p.z));
    const width = Math.max(maxX - minX, (maxZ - minZ) * 1.5, 200) * 1.15;
    this.view = { x: (minX + maxX - width) / 2, z: (minZ + maxZ - width / 1.5) / 2, width, height: width / 1.5 };
  }
  zoom(factor: number, x = this.view.x + this.view.width / 2, z = this.view.z + this.view.height / 2) {
    if (this.view.width * factor < 10 || this.view.width * factor > 10000000) return;
    this.view = { x: x - (x - this.view.x) * factor, z: z - (z - this.view.z) * factor, width: this.view.width * factor, height: this.view.height * factor };
  }
  coordinates(event: MouseEvent | WheelEvent, surface: HTMLElement | SVGSVGElement) {
    const svg = surface as SVGSVGElement;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const mapped = point.matrixTransform(svg.getScreenCTM().inverse());
    return orientPoint(mapped.x, mapped.y, this.rotationTurns);
  }
  wheel(event: WheelEvent, svg: HTMLElement | SVGSVGElement) {
    event.preventDefault();
    const point = this.coordinates(event, svg);
    this.zoom(event.deltaY > 0 ? 1.12 : 0.89, point.x, point.z);
  }
  pointerDown(event: PointerEvent, svg: HTMLElement | SVGSVGElement, element?: Element, kind: 'node' | 'point' = 'node', index = -1) {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    svg.focus();
    if (event.button === 1 && event.ctrlKey) {
      const bounds = svg.getBoundingClientRect();
      const cx = bounds.left + bounds.width / 2;
      const cy = bounds.top + bounds.height / 2;
      this.rotationDrag = { x: event.clientX, radius: Math.max(40, Math.hypot(event.clientX - cx, event.clientY - cy)), cx, cy };
      svg.setPointerCapture(event.pointerId);
      return;
    }
    const point = this.coordinates(event, svg);
    if (this.mode === 'drawGeometry' && event.button === 0) {
      if (event.ctrlKey) { this.finishGeometryDrawing(); return; }
      if (kind !== 'point' || !element) {
        this.drawGeometryPoint(point.x, point.z, element);
        return;
      }
    }
    if (!element && event.button === 0 && this.mode === 'node') {
      this.section = 'nodes';
      this.createEntry();
      this.mutate(() => {
        const position = this.selected.querySelector('position');
        position.setAttribute('x', String(authorNumber(point.x)));
        position.setAttribute('z', String(authorNumber(point.z)));
      });
      return;
    }
    if (!element && event.button === 0 && this.mode === 'point' && this.selectedGeometry) {
      this.addPoint(point.x, point.z);
      return;
    }
    if (element && event.button === 0) {
      if (kind === 'node') this.select(element, 'nodes');
      else {
        const geometry = element.parentElement?.parentElement;
        if (geometry?.tagName === 'geometry') this.select(geometry, 'geometry');
        this.pointIndex = index;
      }
      this.drag = { ...point, clientX: event.clientX, clientY: event.clientY, kind, element, before: this.snapshot() };
    } else this.drag = { ...point, clientX: event.clientX, clientY: event.clientY, kind: 'pan' };
    svg.setPointerCapture(event.pointerId);
  }
  pointerMove(event: PointerEvent, svg: HTMLElement | SVGSVGElement) {
    if (this.showCoordinates) this.coordinatePointer = this.coordinates(event, svg);
    if (this.rotationDrag) {
      if (!event.ctrlKey || !(event.buttons & 4)) { this.rotationDrag = null; return; }
      const drag = this.rotationDrag;
      const radius = Math.max(40, Math.hypot(event.clientX - drag.cx, event.clientY - drag.cy));
      const sensitivity = Math.max(0.25, Math.min(4, drag.radius / radius));
      this.stageRotation = (this.stageRotation + (event.clientX - drag.x) * 0.1 * sensitivity) % 360;
      drag.x = event.clientX;
      return;
    }
    if (!this.drag) return;
    const point = this.coordinates(event, svg);
    if (this.drag.kind === 'pan') {
      this.view.x += this.drag.x - point.x;
      this.view.z += this.drag.z - point.z;
    } else {
      const before = graphCoordinates(this.doc);
      const element = this.drag.kind === 'node' ? this.drag.element.querySelector('position') : this.drag.element;
      element.setAttribute('x', String(authorNumber(point.x)));
      element.setAttribute('z', String(authorNumber(point.z)));
      synchronizeGraph(this.doc, before);
      this.refresh();
    }
  }
  pointerUp(event: PointerEvent, svg: HTMLElement | SVGSVGElement) {
    this.rotationDrag = null;
    if (this.drag?.before) {
      this.documentSource = serializePreset(this.doc);
      this.source = this.documentSource;
    }
    if (this.drag?.before && this.drag.before.source !== this.documentSource) {
      this.undoStack.push(this.drag.before);
      this.redoStack = [];
    }
    this.drag = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  }
  addPoint(x?: number, z?: number) {
    const geometry = this.selectedGeometry;
    if (!geometry) return;
    this.mutate(() => {
      const points = geometry.querySelector('points');
      const previous = this.handles[this.pointIndex] || this.handles[this.handles.length - 1];
      const point = this.doc.createElement('item');
      point.setAttribute('x', String(authorNumber(x ?? (previous?.x || 0) + 50)));
      point.setAttribute('y', previous?.element.getAttribute('y') || '0');
      point.setAttribute('z', String(authorNumber(z ?? previous?.z ?? 0)));
      points.insertBefore(point, previous?.element.nextElementSibling || points.lastElementChild);
      this.pointIndex = Array.from(points.children).indexOf(point);
    });
  }
  removePoint() {
    if (!this.pointElement) return;
    if (this.handles.length <= 2) {
      this.error = 'Geometry must retain at least two points';
      return;
    }
    if (this.pointIndex === 0 || this.pointIndex === this.handles.length - 1) {
      this.error = 'Route endpoints stay attached to their nodes; remove an interior point instead';
      return;
    }
    this.mutate(() => {
      this.pointElement.remove();
      this.pointIndex = -1;
    });
  }
  mapKey(event: KeyboardEvent) {
    if (this.controlsOpen) return;
    const matches = (action: Parameters<WorldMapKeybindings['matches']>[0]) => this.keybindings.matches(action, event);
    const directions = [
      { normal: 'up', fast: 'fastUp', x: 0, z: -1 }, { normal: 'down', fast: 'fastDown', x: 0, z: 1 },
      { normal: 'left', fast: 'fastLeft', x: -1, z: 0 }, { normal: 'right', fast: 'fastRight', x: 1, z: 0 },
    ] as const;
    const direction = directions.find(item => matches(item.normal) || matches(item.fast));
    let handled = true;
    if (direction) {
      const step = matches(direction.fast) ? 10 : 1;
      const delta = orientPoint(direction.x * step, direction.z * step, this.rotationTurns);
      const element = this.pointElement || (this.selected?.tagName === 'node' ? this.selected.querySelector('position') : null);
      if (element) this.mutate(() => {
        element.setAttribute('x', String(authorNumber(this.number(element, 'x') + delta.x)));
        element.setAttribute('z', String(authorNumber(this.number(element, 'z') + delta.z)));
      });
      else { this.view.x += delta.x * this.unit * 20; this.view.z += delta.z * this.unit * 20; }
    } else if (matches('delete')) this.deleteSelected(false);
    else if (matches('fit')) this.fit();
    else if (matches('zoomIn')) this.zoom(0.8);
    else if (matches('zoomOut')) this.zoom(1.25);
    else if (matches('cancel')) {
      this.cancelContext();
    } else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }
  commandOpen = false;
  searchPrefixes = SEARCH_PREFIXES;
  showCoordinates = false;
  coordinatePointer = { x: 0, z: 0 };
  coordinateGridStep = 0;
  get gridStep() {
    if (this.coordinateGridStep > 0) return this.coordinateGridStep;
    const desired = this.view.width / 12;
    const power = 10 ** Math.floor(Math.log10(Math.max(desired, 0.01)));
    return [1, 2, 5, 10].map(value => value * power).find(value => value >= desired) || power;
  }
  entityInRegion(element: Element, section: string, region: string) { return this.entryRegions(element, section).has(region); }
  private focusStage() { this.tab = 'map'; setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('svg.map')?.focus()); }
  private focusInspector() {
    setTimeout(() => Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.inspector app-world-map-fields input:not([disabled]):not([readonly]), .inspector app-world-map-fields select:not([disabled]), .inspector app-world-map-fields textarea:not([disabled])')).find(control => control.tabIndex >= 0 && control.getClientRects().length > 0)?.focus());
  }
  private clickEditor(selector: string, showTools = false) {
    if (showTools && !this.toolsOpen) this.toggleTools();
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.click());
  }
  private cancelContext() {
    const details = this.host.nativeElement.querySelector<HTMLDetailsElement>('details[open]');
    if (details) { details.open = false; return; }
    if (this.labelMenuOpen) { this.labelMenuOpen = false; return; }
    if (this.coolonPortalChoices.length) { this.coolonPortalChoices = []; return; }
    if (this.mode !== 'select') { this.finishGeometryDrawing(); this.mode = 'select'; return; }
    this.selected = null;
    this.pointIndex = -1;
  }
  @HostListener('document:keydown', ['$event'])
  keyboard(event: KeyboardEvent) {
    if (this.controlsOpen || this.commandOpen) return;
    const target = event.target as HTMLElement;
    const inspector = target.closest('.inspector');
    if (inspector && (this.keybindings.matches('inspectorNext', event) || this.keybindings.matches('inspectorPrevious', event))) {
      const controls = Array.from(inspector.querySelectorAll<HTMLElement>('app-world-map-fields input, app-world-map-fields select, app-world-map-fields textarea, app-world-map-fields button')).filter(control => !control.hasAttribute('disabled') && !control.hasAttribute('readonly') && control.tabIndex >= 0 && control.getClientRects().length);
      if (controls.length) {
        event.preventDefault();
        const delta = this.keybindings.matches('inspectorPrevious', event) ? -1 : 1;
        controls[(controls.indexOf(target) + delta + controls.length) % controls.length].focus();
      }
      return;
    }
    if (inspector && this.keybindings.matches('cancel', event)) { event.preventDefault(); this.focusStage(); return; }
    if (this.keybindings.matches('command', event)) { event.preventDefault(); this.commandOpen = true; return; }
    if (this.keybindings.matches('focusStage', event)) { event.preventDefault(); this.focusStage(); return; }
    if (target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const action = KEY_ACTIONS.find(action => action.scope === 'Page' && this.keybindings.matches(action.id, event));
    if (!action) return;
    event.preventDefault();
    this.runKeyAction(action.id);
  }
  runKeyAction(action: KeyAction) {
    switch (action) {
      case 'undo': this.undo(); break;
      case 'redo': this.redo(); break;
      case 'tools': this.toggleTools(); break;
      case 'pin': this.clickEditor('app-world-map-tools .handle', true); break;
      case 'story': this.toggleStoryRefs(); break;
      case 'north': case 'east': case 'south': case 'west': this.orientation = ['north', 'east', 'south', 'west'].indexOf(action); this.stageRotation = 0; break;
      case 'rotateLeft': this.stageRotation -= 5; break;
      case 'rotateRight': this.stageRotation += 5; break;
      case 'coords': this.showCoordinates = !this.showCoordinates; break;
      case 'labels': this.showLabels = !this.showLabels; this.saveLabelSettings(); break;
      case 'labelConfig': this.clickEditor('button[aria-label="Configure labels"]', true); break;
      case 'fit': this.fit(); break;
      case 'zoomIn': this.zoom(0.8); break;
      case 'zoomOut': this.zoom(1.25); break;
      case 'back': this.navigateEntity(false); break;
      case 'forward': this.navigateEntity(true); break;
      case 'previousRegion': case 'nextRegion': {
        const ids = ['', ...this.regions.map(region => region.getAttribute('id'))];
        const index = Math.max(0, Math.min(ids.length - 1, ids.indexOf(this.region) + (action === 'nextRegion' ? 1 : -1)));
        this.changeRegion(ids[index]); break;
      }
      case 'select': case 'node': this.finishGeometryDrawing(); this.mode = action; break;
      case 'geometry': this.startGeometryDrawing(); break;
      case 'junction': this.toggleJunctionTool(); break;
      case 'coolon': this.toggleCoolonTool(); break;
      case 'portals': this.togglePortalView(); break;
      case 'places': this.togglePlaceView(); break;
      case 'registrySearch': this.host.nativeElement.querySelector<HTMLElement>('input.search')?.focus(); break;
      case 'inspector': this.focusInspector(); break;
      case 'diagnostics': this.showDiagnostics = !this.showDiagnostics; break;
      case 'config': this.clickEditor('app-world-map-config button'); break;
      case 'background': this.clickEditor('app-world-map-terrain summary'); break;
      case 'map': this.setTab('map'); break;
      case 'xml': this.setTab('source'); break;
      case 'assets': this.setTab('assets'); break;
      case 'vanilla': void this.loadVanilla(); break;
      case 'save': this.saveBrowserPreset(); break;
      case 'import': this.clickEditor('input[type="file"]'); break;
      case 'export': void this.exportPreset(); break;
      case 'package': this.download(true); break;
      case 'controls': this.controlsOpen = true; break;
      case 'viewport': this.fillViewport = !this.fillViewport; break;
      case 'header': this.toggleHeader(); break;
      case 'theme': this.cycleTheme(); break;
      case 'cancel': this.cancelContext(); break;
      case 'command': this.commandOpen = true; break;
      case 'focusStage': this.focusStage(); break;
    }
  }
  setTab(tab: 'map' | 'source' | 'assets') {
    this.tab = tab;
    if (tab === 'source') this.source = this.documentSource;
  }
  applySource() {
    try {
      const parsed = parsePreset(this.source);
      this.mutate(() => {
        this.doc = parsed;
        this.selected = null;
      });
      this.error = '';
      this.status = 'XML applied';
    } catch (error) {
      this.error = String(error);
    }
  }
  async loadVanilla() {
    this.loading = true;
    this.error = '';
    try {
      const response = await fetch('assets/world-map/vanilla.wmap');
      if (!response.ok) throw new Error('Vanilla preset is unavailable');
      this.importSource(await response.text(), 'vanilla.wmap');
      this.assets.clear();
      this.refresh();
      this.region = this.regions.find((region) => region.getAttribute('legacyTemplate') === 'SOUTH_SERDIO_0')?.getAttribute('id') || '';
      this.fit();
    } catch (error) {
      this.error = String(error);
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }
  private async loadNativeCatalog() {
    if (typeof fetch !== 'function') return;
    try {
      const response = await fetch('assets/world-map/vanilla.wmap');
      if (!response.ok) return;
      const nativeDocument = parsePreset(await response.text());
      for (const section of Object.keys(SECTIONS)) {
        const nativeEntries = entries(nativeDocument, section);
        const ids = nativeEntries.map((entry) => entry.getAttribute('id')).filter(Boolean);
        this.nativeRegistry[section] = Array.from(new Set([...(this.nativeRegistry[section] || []), ...ids]));
        this.nativeRegistryLabels[section] ||= {};
        for (const entry of nativeEntries) {
          const id = entry.getAttribute('id');
          const label = entry.getAttribute('label') || entry.getAttribute('name');
          if (id && label) this.nativeRegistryLabels[section][id] = label;
        }
      }
      this.refresh();
    } catch {
      // The editor remains usable with manually entered IDs when the optional native suggestion catalog is unavailable.
    }
  }
  importSource(source: string, filename: string) {
    const parsed = parsePreset(source);
    this.entityBack = [];
    this.entityForward = [];
    this.mutate(() => {
      this.doc = parsed;
      this.selected = null;
    });
    this.filename = filename.replace(/\.zip$/i, '');
    this.error = '';
    this.tab = 'map';
    this.region = '';
    this.fit();
    this.status = '';
  }
  async importFiles(files: FileList | File[]) {
    if (!files?.length) return;
    this.loading = true;
    this.error = '';
    try {
      const all = Array.from(files);
      const preset = all.find((f) => /\.wmap(?:\.zip)?$/i.test(f.name) || /\.zip$/i.test(f.name));
      if (preset && /\.zip$/i.test(preset.name)) {
        if (preset.size > 256 * 1024 * 1024) throw new Error('Package exceeds the 256 MB editor limit');
        const unpacked = readPackage(new Uint8Array(await preset.arrayBuffer()));
        this.importSource(unpacked.source, preset.name);
        this.assets = unpacked.assets;
      } else {
        const pending = new Map<string, Uint8Array>();
        const base = preset?.webkitRelativePath ? preset.webkitRelativePath.slice(0, preset.webkitRelativePath.lastIndexOf('/') + 1) : '';
        for (const file of all.filter((f) => f !== preset)) {
          if (file.size > 64 * 1024 * 1024) throw new Error(`Asset exceeds 64 MB: ${file.name}`);
          const relative = file.webkitRelativePath || file.name;
          const path = safeAssetPath(base && relative.startsWith(base) ? relative.slice(base.length) : relative);
          pending.set(path, new Uint8Array(await file.arrayBuffer()));
        }
        if (preset) {
          if (preset.size > 16 * 1024 * 1024) throw new Error('Preset XML exceeds 16 MB');
          this.importSource(await preset.text(), preset.name);
          this.assets = pending;
        } else {
          this.mutate(() => {
            for (const [path, bytes] of pending) this.assets.set(path, bytes);
          });
          this.status = `Attached ${pending.size} asset files`;
        }
      }
      this.refresh();
    } catch (error) {
      this.error = String(error);
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }
  fileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    void this.importFiles(input.files);
    input.value = '';
  }
  drop(event: DragEvent) {
    event.preventDefault();
    void this.importFiles(event.dataTransfer.files);
  }
  saveBrowserPreset() {
    try {
      const bytes = writePackage(serializePreset(this.doc), this.assets);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      localStorage.setItem('lodtools.world-map.saved-preset', JSON.stringify({ filename: this.filename, data: btoa(binary) }));
      this.status = 'Preset and assets saved in this browser';
      this.error = '';
    } catch {
      this.error = 'Could not save this preset in browser storage. Storage may be full or unavailable; use Export package to keep the preset and its assets.';
    }
  }
  private restoreBrowserPreset(): boolean {
    try {
      const saved = JSON.parse(localStorage.getItem('lodtools.world-map.saved-preset') || 'null');
      if (!saved) return false;
      const unpacked = readPackage(Uint8Array.from(atob(saved.data), character => character.charCodeAt(0)));
      this.importSource(unpacked.source, saved.filename);
      this.assets = unpacked.assets;
      this.refresh();
      this.undoStack = [];
      this.redoStack = [];
      this.status = 'Restored browser-saved preset';
      return true;
    } catch { return false; }
  }
  async exportPreset() {
    const picker = (window as unknown as { showSaveFilePicker?: (options: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker;
    if (!picker) { this.download(); return; }
    try {
      const handle = await picker.call(window, { suggestedName: this.filename.replace(/\.wmap$/i, '') + '.wmap', types: [{ description: 'World map preset', accept: { 'application/xml': ['.wmap'] } }] });
      const writable = await handle.createWritable();
      await writable.write(new Blob([serializePreset(this.doc)], { type: 'application/xml' }));
      await writable.close();
      this.status = 'Exported world map preset';
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') this.error = String(error);
    }
  }
  download(packaged = false) {
    try {
      const source = serializePreset(this.doc);
      const bytes = packaged ? writePackage(source, this.assets) : new TextEncoder().encode(source);
      const blob = new Blob([new Uint8Array(bytes).buffer], { type: packaged ? 'application/zip' : 'application/xml' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = this.filename.replace(/\.wmap$/i, '') + (packaged ? '.wmap.zip' : '.wmap');
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.status = `Exported ${anchor.download}${this.issues.length ? ' · review diagnostics before loading in game' : ''}`;
    } catch (error) {
      this.error = String(error);
    }
  }
  removeAsset(path: string) {
    this.mutate(() => this.assets.delete(path));
  }
  revealIssue(issue: Diagnostic) {
    let element = issue.element;
    while (element.parentElement && element.parentElement !== this.root && element.parentElement.parentElement !== this.root) element = element.parentElement;
    if (element.parentElement?.parentElement === this.root) {
      this.section = element.parentElement.tagName;
      this.select(element);
    } else if (element.tagName === 'rules') {
      this.section = 'rules';
      this.select(element);
    }
  }
}
