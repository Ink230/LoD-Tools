import { describe, expect, it } from 'vitest';
import { entries, parsePreset } from './world-map-document';
import { splitJunction } from './world-map-junction';

const fixture = () => parsePreset(`<worldMapPreset version="1" id="custom:test"><nodes><node id="custom:a"><position x="0" y="0" z="0"/></node><node id="custom:b"><position x="100" y="20" z="0"/></node></nodes><geometry><geometry id="custom:g"><points><item x="0" y="0" z="0"/><item x="100" y="20" z="0"/></points></geometry></geometry><routes><route id="custom:f" geometry="custom:g" start="custom:a" end="custom:b" direction="1" encounterRate="1"/><route id="custom:r" geometry="custom:g" start="custom:b" end="custom:a" direction="-1" encounterRate="2"/></routes><places><place id="custom:p"/></places><portals><portal id="custom:pf" route="custom:f" place="custom:p" region="custom:region"/><portal id="custom:pr" route="custom:r" place="custom:p" region="custom:region"/></portals><storyPresets><storyPreset id="custom:s"><enabledPortals><item id="custom:pf"/><item id="custom:pr"/></enabledPortals></storyPreset></storyPresets></worldMapPreset>`);

describe('junction splitting', () => {
  it('splits a directional pair and preserves portal anchors, height and directional settings', () => {
    const doc = fixture();
    const [forward, reverse] = entries(doc, 'routes');
    const node = splitJunction(doc, forward, 40, 3);
    expect(node.querySelector('position').getAttribute('y')).toBe('8');
    const routes = entries(doc, 'routes');
    expect(routes).toHaveLength(4);
    expect(forward.getAttribute('start')).toBe('custom:a');
    expect(reverse.getAttribute('start')).toBe('custom:b');
    expect(forward.getAttribute('end')).toBe(node.getAttribute('id'));
    expect(reverse.getAttribute('end')).toBe(node.getAttribute('id'));
    for (const geometry of entries(doc, 'geometry')) {
      const pair = routes.filter(route => route.getAttribute('geometry') === geometry.getAttribute('id'));
      expect(pair).toHaveLength(2);
      expect(pair[0].getAttribute('start')).toBe(pair[1].getAttribute('end'));
      expect(pair[0].getAttribute('end')).toBe(pair[1].getAttribute('start'));
      expect(geometry.querySelectorAll('points > item')).toHaveLength(2);
    }
    expect(routes.filter(route => route.getAttribute('encounterRate') === '2')).toHaveLength(2);
    expect(entries(doc, 'portals').slice(0, 2).map(portal => portal.getAttribute('route'))).toEqual(['custom:f', 'custom:r']);
    expect(doc.querySelectorAll('enabledPortals > item')).toHaveLength(4);
    expect(entries(doc, 'portals').slice(2).every(portal => portal.getAttribute('junctionIndex') === '0' && portal.hasAttribute('place'))).toBe(true);
  });
  it('rejects a terminal split without changing the document', () => {
    const doc = fixture();
    const before = new XMLSerializer().serializeToString(doc);
    expect(() => splitJunction(doc, entries(doc, 'routes')[0], 0, 0)).toThrow('terminal');
    expect(new XMLSerializer().serializeToString(doc)).toBe(before);
  });
});
