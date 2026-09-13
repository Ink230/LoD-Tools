import { entries } from './world-map-document';

/** Split all directional records sharing geometry, retaining their original arrival anchors. */
export function splitJunction(doc: XMLDocument, route: Element, x: number, z: number): Element {
  const geometry = entries(doc, 'geometry').find(entry => entry.getAttribute('id') === route.getAttribute('geometry'));
  const points = Array.from(geometry?.querySelectorAll('points > item') || []);
  if (points.length < 2) throw new Error('The route needs geometry with at least two points.');
  const xyz = (point: Element) => ['x', 'y', 'z'].map(axis => Number(point.getAttribute(axis)));
  let best = { distance: Infinity, index: 0, t: 0, position: [0, 0, 0] };
  for (let i = 0; i < points.length - 1; i++) {
    const a = xyz(points[i]), b = xyz(points[i + 1]);
    const dx = b[0] - a[0], dz = b[2] - a[2];
    const length = dx * dx + dz * dz;
    if (!length) continue;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / length));
    const position = a.map((value, axis) => value + (b[axis] - value) * t);
    const distance = (position[0] - x) ** 2 + (position[2] - z) ** 2;
    if (distance < best.distance) best = { distance, index: i, t, position };
  }
  if (!Number.isFinite(best.distance) || (best.index === 0 && best.t < 0.000001) || (best.index === points.length - 2 && best.t > 0.999999)) throw new Error('Choose a point inside the route, away from its terminal nodes.');
  const routes = entries(doc, 'routes').filter(entry => entry.getAttribute('geometry') === geometry.getAttribute('id'));
  if (routes.length !== 2 || new Set(routes.map(entry => entry.getAttribute('direction'))).size !== 2 || routes.some(entry => !['1', '-1'].includes(entry.getAttribute('direction'))) || routes[0].getAttribute('start') !== routes[1].getAttribute('end') || routes[0].getAttribute('end') !== routes[1].getAttribute('start')) throw new Error('Junction splitting needs two corresponding routes with reversed start and end nodes.');
  const unique = (section: string, kind: string) => {
    let index = 1;
    while (entries(doc, section).some(entry => entry.getAttribute('id') === `custom:${kind}_${index}`)) index++;
    return `custom:${kind}_${index}`;
  };
  const append = (section: string, element: Element) => {
    let container = Array.from(doc.documentElement.children).find(child => child.tagName === section);
    if (!container) container = doc.documentElement.appendChild(doc.createElement(section));
    container.appendChild(element);
  };
  const node = doc.createElement('node');
  node.setAttribute('id', unique('nodes', 'node'));
  const position = node.appendChild(doc.createElement('position'));
  ['x', 'y', 'z'].forEach((axis, i) => position.setAttribute(axis, String(best.position[i])));
  append('nodes', node);
  const split = doc.createElement('item');
  ['x', 'y', 'z'].forEach((axis, i) => split.setAttribute(axis, String(best.position[i])));
  const left = points.slice(0, best.index + 1);
  const right = points.slice(best.index + 1);
  if (best.t > 0.000001) left.push(split);
  if (best.t < 0.999999) right.unshift(split);
  const second = geometry.cloneNode(true) as Element;
  second.setAttribute('id', unique('geometry', 'geometry'));
  second.removeAttribute('legacyIndex');
  append('geometry', second);
  geometry.querySelector('points').replaceChildren(...left.map(point => point.cloneNode(true)));
  second.querySelector('points').replaceChildren(...right.map(point => point.cloneNode(true)));
  const originalPortals = [...entries(doc, 'portals')];
  const place = doc.createElement('place');
  place.setAttribute('id', unique('places', 'junction_place'));
  place.setAttribute('services', '0');
  place.setAttribute('thumbnail', '0');
  append('places', place);
  for (const original of routes) {
    const id = original.getAttribute('id');
    const forward = original.getAttribute('direction') === '1';
    const continuation = original.cloneNode(true) as Element;
    continuation.setAttribute('id', unique('routes', 'route'));
    continuation.removeAttribute('legacyIndex');
    continuation.setAttribute('start', node.getAttribute('id'));
    continuation.setAttribute('geometry', (forward ? second : geometry).getAttribute('id'));
    original.setAttribute('end', node.getAttribute('id'));
    original.setAttribute('geometry', (forward ? geometry : second).getAttribute('id'));
    append('routes', continuation);
    // Route-set rules must continue to cover the whole original path.
    for (const item of Array.from(doc.querySelectorAll('item[id]')).filter(item => item.parentElement?.tagName === 'routes' && item.getAttribute('id') === id)) {
      const copy = item.cloneNode(true) as Element;
      copy.setAttribute('id', continuation.getAttribute('id'));
      item.after(copy);
    }
    // Runtime junctions require an unnamed place and a nonnegative junction marker.
    for (const source of originalPortals.filter(portal => portal.getAttribute('route') === id)) {
      const portal = doc.createElement('portal');
      portal.setAttribute('id', unique('portals', 'junction_portal'));
      portal.setAttribute('route', continuation.getAttribute('id'));
      portal.setAttribute('place', place.getAttribute('id'));
      portal.setAttribute('junctionIndex', '0');
      for (const name of ['from', 'to']) {
        const endpoint = portal.appendChild(doc.createElement(name));
        endpoint.setAttribute('cut', '0');
        endpoint.setAttribute('scene', '0');
      }
      for (const field of ['region', 'continent']) {
        if (source.hasAttribute(field)) portal.setAttribute(field, source.getAttribute(field));
      }
      append('portals', portal);
      for (const rule of Array.from(doc.querySelectorAll('rules > portals > portal')).filter(rule => rule.getAttribute('id') === source.getAttribute('id'))) {
        const copy = rule.cloneNode(true) as Element;
        copy.setAttribute('id', portal.getAttribute('id'));
        rule.after(copy);
      }
      for (const item of Array.from(doc.querySelectorAll('enabledPortals > item')).filter(item => item.getAttribute('id') === source.getAttribute('id'))) {
        const copy = item.cloneNode(true) as Element;
        copy.setAttribute('id', portal.getAttribute('id'));
        item.after(copy);
      }
    }
  }
  return node;
}
