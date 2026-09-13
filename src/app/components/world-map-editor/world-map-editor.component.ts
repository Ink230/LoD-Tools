import { WorldMapTerrainComponent } from './world-map-terrain.component';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorldMapInspectorComponent } from './world-map-inspector.component';
import { WorldMapCanvasComponent } from './world-map-canvas.component';
import { WorldMapDocumentPanelsComponent } from './world-map-document-panels.component';
import { Diagnostic, diagnostics, entries, parsePreset, SECTIONS, serializePreset, TEMPLATES } from './world-map-document';
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
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [WorldMapTerrainComponent, FormsModule, WorldMapInspectorComponent, WorldMapCanvasComponent, WorldMapDocumentPanelsComponent],
  templateUrl: './world-map-editor.component.html',
  styleUrls: ['./world-map-editor.component.css', './world-map-viewport.css'],
})
export class WorldMapEditorComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  doc = parsePreset('<worldMapPreset version="1" id="custom:world_map" name="Untitled world map" description=""/>');
  fillViewport = true;
  section = 'nodes';
  sections = Object.keys(SECTIONS);
  selected: Element | null = null;
  search = '';
  region = '';
  mode: 'select' | 'node' | 'point' = 'select';
  tab: 'map' | 'source' | 'assets' = 'map';
  filename = 'world-map.wmap';
  status = 'Load the vanilla preset or import a .wmap to begin';
  error = '';
  source = '';
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
  readonly labelKinds = ['places', 'nodes', 'routes', 'portals', 'geometry'] as const;
  activeLabels = { places: true, nodes: true, routes: false, portals: false, geometry: false };
  mapNodeLabel(id: string) {
    if (this.activeLabels.places && this.nodePlaces.has(id)) return this.nodeName(id);
    return this.activeLabels.nodes ? this.shortId(id) : '';
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

  ngOnInit() {
    this.refresh();
    void this.loadNativeCatalog();
  }
  get root() {
    return this.doc.documentElement;
  }
  get title() {
    return this.root.getAttribute('name') || 'Untitled world map';
  }
  get items() {
    return entries(this.doc, this.section).filter((e) => !this.search || (e.getAttribute('id') + ' ' + e.getAttribute('name')).toLowerCase().includes(this.search.toLowerCase()));
  }
  get regions() {
    return entries(this.doc, 'regions');
  }
  get assetEntries() {
    return Array.from(this.assets.entries());
  }
  get viewBox() {
    const a = orientPoint(this.view.x, this.view.z, this.orientation);
    const b = orientPoint(this.view.x + this.view.width, this.view.z + this.view.height, this.orientation);
    return `${Math.min(a.x, b.x)} ${Math.min(a.z, b.z)} ${Math.abs(b.x - a.x)} ${Math.abs(b.z - a.z)}`;
  }
  orientation = 0;
  readonly orientations = ['North', 'East', 'South', 'West'];
  get mapTransform() {
    return `rotate(${-this.orientation * 90}) scale(1 -1)`;
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
    return this.nodes.filter((n) => ids.has(n.id));
  }
  label(value: string) {
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
    this.issues = diagnostics(this.doc, Array.from(this.assets.keys()), this.nativeRegistry);
    this.changeDetector.markForCheck();
  }
  snapshot(): EditorSnapshot {
    return { source: serializePreset(this.doc), assets: new Map(this.assets), filename: this.filename };
  }
  mutate(action: () => void) {
    const before = this.snapshot();
    const coordinates = graphCoordinates(this.doc);
    action();
    synchronizeGraph(this.doc, coordinates);
    if (serializePreset(this.doc) !== before.source || this.assets.size !== before.assets.size || Array.from(this.assets).some(([key, value]) => before.assets.get(key) !== value)) {
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
    if (this.tab === 'source') this.source = serializePreset(this.doc);
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
  entityBack: { id: string; section: string }[] = [];
  entityForward: { id: string; section: string }[] = [];
  private currentEntity() {
    return this.selected ? { id: this.selected.getAttribute('id') || '', section: this.section } : undefined;
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
      this.goToEntry({ element, section: target.section }, false);
      return;
    }
  }
  select(element: Element, section?: string, recordHistory = true) {
    const current = this.currentEntity();
    if (recordHistory && current && (this.selected !== element || this.section !== (section || this.section))) {
      this.entityBack.push(current);
      this.entityForward = [];
    }
    this.selected = element;
    this.pointIndex = -1;
    if (section) this.section = section;
  }
  goToEntry(target: { element: Element; section: string }, recordHistory = true) {
    this.select(target.element, target.section, recordHistory);
    this.search = '';
    this.tab = 'map';
    const id = target.element.getAttribute('id');
    let route = this.routes.find((entry) => target.section === 'routes' ? entry.id === id : target.section === 'geometry' && entry.element.getAttribute('geometry') === id);
    if (target.section === 'portals' || target.section === 'places') {
      const portal = target.section === 'portals' ? target.element : entries(this.doc, 'portals').find((entry) => entry.getAttribute('place') === id);
      route = this.routes.find((entry) => entry.id === portal?.getAttribute('route'));
    }
    const node = target.section === 'nodes' ? this.nodes.find((entry) => entry.id === id) : route?.start;
    if (node) {
      if (!this.filteredNodes.some((entry) => entry.id === node.id)) this.region = '';
      this.view = { ...this.view, x: node.x - this.view.width / 2, z: node.z - this.view.height / 2 };
    }
  }
  chooseSection(section: string) {
    this.section = section;
    this.selected = null;
    this.search = '';
    this.pointIndex = -1;
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
        while (this.registry[this.section]?.includes(`custom:${entryName}_${index}`)) index++;
        element.setAttribute('id', tag === 'mod' ? 'custom' : `custom:${entryName}_${index}`);
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
  deleteSelected() {
    if (this.pointElement) {
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
    return orientPoint(mapped.x, mapped.y, this.orientation);
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
    const point = this.coordinates(event, svg);
    if (!element && event.button === 0 && this.mode === 'node') {
      this.section = 'nodes';
      this.createEntry();
      this.mutate(() => {
        const position = this.selected.querySelector('position');
        position.setAttribute('x', String(Math.round(point.x)));
        position.setAttribute('z', String(Math.round(point.z)));
      });
      return;
    }
    if (!element && event.button === 0 && this.mode === 'point' && this.selectedGeometry) {
      this.addPoint(point.x, point.z);
      return;
    }
    if (element && event.button === 0) {
      if (kind === 'node') this.select(element, 'nodes');
      else this.pointIndex = index;
      this.drag = { ...point, clientX: event.clientX, clientY: event.clientY, kind, element, before: this.snapshot() };
    } else this.drag = { ...point, clientX: event.clientX, clientY: event.clientY, kind: 'pan' };
    svg.setPointerCapture(event.pointerId);
  }
  pointerMove(event: PointerEvent, svg: HTMLElement | SVGSVGElement) {
    if (!this.drag) return;
    const point = this.coordinates(event, svg);
    if (this.drag.kind === 'pan') {
      this.view.x += this.drag.x - point.x;
      this.view.z += this.drag.z - point.z;
    } else {
      const before = graphCoordinates(this.doc);
      const element = this.drag.kind === 'node' ? this.drag.element.querySelector('position') : this.drag.element;
      element.setAttribute('x', String(Math.round(point.x)));
      element.setAttribute('z', String(Math.round(point.z)));
      synchronizeGraph(this.doc, before);
      this.refresh();
    }
  }
  pointerUp(event: PointerEvent, svg: HTMLElement | SVGSVGElement) {
    if (this.drag?.before && this.drag.before.source !== serializePreset(this.doc)) {
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
      point.setAttribute('x', String(Math.round(x ?? (previous?.x || 0) + 50)));
      point.setAttribute('y', previous?.element.getAttribute('y') || '0');
      point.setAttribute('z', String(Math.round(z ?? previous?.z ?? 0)));
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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const delta = orientPoint(event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0, event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0, this.orientation);
      const dx = delta.x;
      const dz = delta.z;
      const element = this.pointElement || (this.selected?.tagName === 'node' ? this.selected.querySelector('position') : null);
      if (element)
        this.mutate(() => {
          element.setAttribute('x', String(this.number(element, 'x') + dx));
          element.setAttribute('z', String(this.number(element, 'z') + dz));
        });
      else {
        this.view.x += dx * this.unit * 20;
        this.view.z += dz * this.unit * 20;
      }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.deleteSelected();
    }
    if (event.key.toLowerCase() === 'f') this.fit();
    if (event.key === '+' || event.key === '=') this.zoom(0.8);
    if (event.key === '-') this.zoom(1.25);
    if (event.key === 'Escape') {
      this.selected = null;
      this.pointIndex = -1;
      this.mode = 'select';
    }
  }
  @HostListener('document:keydown', ['$event'])
  keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.fillViewport) {
      this.fillViewport = false;
      return;
    }
    if ((event.target as HTMLElement).matches('input,textarea,select')) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
    }
  }
  setTab(tab: 'map' | 'source' | 'assets') {
    this.tab = tab;
    if (tab === 'source') this.source = serializePreset(this.doc);
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
