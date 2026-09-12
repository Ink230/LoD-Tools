import { entries } from './world-map-document';

type Position = [number, number, number];
const axes = ['x', 'y', 'z'];
const position = (element: Element): Position => axes.map((axis) => Number(element.getAttribute(axis))) as Position;
const setPosition = (element: Element, value: Position) => axes.forEach((axis, index) => element.setAttribute(axis, String(value[index])));

/** Capture graph boundaries before one edit; interior geometry points remain independent. */
export function graphCoordinates(doc: XMLDocument): Map<Element, Position> {
  const coordinates = new Map<Element, Position>();
  for (const node of entries(doc, 'nodes')) {
    const point = node.querySelector('position');
    if (point) coordinates.set(point, position(point));
  }
  for (const geometry of entries(doc, 'geometry')) {
    const points = Array.from(geometry.querySelectorAll('points > item'));
    for (const point of [points[0], points[points.length - 1]].filter(Boolean)) coordinates.set(point, position(point));
  }
  return coordinates;
}

/** A node and every directed route endpoint bound to it represent the same world position. */
export function synchronizeGraph(doc: XMLDocument, before: Map<Element, Position>): void {
  const movedNodes = new Map<string, Position>();
  const routes = entries(doc, 'routes');
  const changed = (element: Element) => {
    const previous = before.get(element);
    return previous && element.ownerDocument === doc && position(element).some((value, index) => value !== previous[index]);
  };
  for (const node of entries(doc, 'nodes')) {
    const point = node.querySelector('position');
    if (point && changed(point)) movedNodes.set(node.getAttribute('id'), position(point));
  }
  for (const geometry of entries(doc, 'geometry')) {
    const points = Array.from(geometry.querySelectorAll('points > item'));
    for (const [index, point] of [
      [0, points[0]],
      [1, points[points.length - 1]],
    ] as const) {
      if (!point || !changed(point)) continue;
      for (const route of routes.filter((route) => route.getAttribute('geometry') === geometry.getAttribute('id'))) {
        const field = (index === 0) !== (route.getAttribute('direction') === '-1') ? 'start' : 'end';
        const id = route.getAttribute(field);
        if (!movedNodes.has(id)) movedNodes.set(id, position(point));
      }
    }
  }
  const endpointUpdates = new Map<Element, Position>();
  for (const [id, value] of movedNodes) {
    const node = entries(doc, 'nodes').find((node) => node.getAttribute('id') === id);
    if (node?.querySelector('position')) setPosition(node.querySelector('position'), value);
    for (const route of routes) {
      if (route.getAttribute('start') !== id && route.getAttribute('end') !== id) continue;
      const geometry = entries(doc, 'geometry').find((geometry) => geometry.getAttribute('id') === route.getAttribute('geometry'));
      const points = Array.from(geometry?.querySelectorAll('points > item') || []);
      const first = (route.getAttribute('start') === id) !== (route.getAttribute('direction') === '-1');
      const point = first ? points[0] : points[points.length - 1];
      if (point) endpointUpdates.set(point, value);
    }
  }
  for (const [point, value] of endpointUpdates) setPosition(point, value);
}
