import { describe, expect, it } from 'vitest';
import { parsePreset } from './world-map-document';
import { graphCoordinates, synchronizeGraph } from './world-map-graph';

const graph = () =>
  parsePreset(`<worldMapPreset version="1" id="custom:graph"><nodes>
  <node id="custom:a"><position x="0" y="0" z="0"/></node><node id="custom:b"><position x="10" y="0" z="10"/></node><node id="custom:c"><position x="20" y="0" z="20"/></node>
  </nodes><geometry><geometry id="custom:ab"><points><item x="0" y="0" z="0"/><item x="5" y="2" z="5"/><item x="10" y="0" z="10"/></points></geometry><geometry id="custom:bc"><points><item x="10" y="0" z="10"/><item x="20" y="0" z="20"/></points></geometry></geometry>
  <routes><route id="custom:ab" start="custom:a" end="custom:b" geometry="custom:ab" direction="1"/><route id="custom:ba" start="custom:b" end="custom:a" geometry="custom:ab" direction="-1"/><route id="custom:bc" start="custom:b" end="custom:c" geometry="custom:bc" direction="1"/></routes></worldMapPreset>`);

describe('directed graph coordinate synchronization', () => {
  it('moves all incident endpoints once across forward, reverse and shared geometry routes', () => {
    const doc = graph();
    const before = graphCoordinates(doc);
    const node = doc.querySelectorAll('node position')[1];
    node.setAttribute('x', '12');
    node.setAttribute('y', '7');
    node.setAttribute('z', '15');
    synchronizeGraph(doc, before);
    const paths = doc.querySelectorAll('geometry > geometry');
    expect(paths[0].querySelector('points').lastElementChild.getAttribute('x')).toBe('12');
    expect(paths[0].querySelector('points').lastElementChild.getAttribute('y')).toBe('7');
    expect(paths[1].querySelector('points').firstElementChild.getAttribute('z')).toBe('15');
    expect(paths[0].querySelectorAll('item')[1].getAttribute('y')).toBe('2');
  });
  it('moves a bound node and its other incident path when editing a geometry endpoint', () => {
    const doc = graph();
    const before = graphCoordinates(doc);
    doc.querySelector('geometry > geometry points').lastElementChild.setAttribute('x', '14');
    synchronizeGraph(doc, before);
    expect(doc.querySelectorAll('node position')[1].getAttribute('x')).toBe('14');
    expect(doc.querySelectorAll('geometry > geometry')[1].querySelector('points').firstElementChild.getAttribute('x')).toBe('14');
  });
});
