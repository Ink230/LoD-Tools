import { describe, expect, it } from 'vitest';
import { diagnostics, entries, parsePreset, serializePreset } from './world-map-document';
import { readPackage, safeAssetPath, writePackage } from './world-map-package';
import { strToU8, zipSync } from 'fflate';

const SOURCE = `<worldMapPreset version="1" id="custom:test" name="Test &amp; paths">
  <nodes><node id="custom:a"><position x="0" y="7" z="0"/></node><node id="custom:b"><position x="100" y="9" z="50"/></node></nodes>
  <geometry><geometry id="custom:path" legacyIndex="-1"><points><item x="0" y="7" z="0"/><item x="100" y="9" z="50"/></points></geometry></geometry>
  <routes><route id="custom:route" legacyIndex="-1" start="custom:a" end="custom:b" geometry="custom:path" direction="1" encounterRate="0" battleStage="0" modelIndex="0" legacyEncounterPlaceholder="0"/></routes>
  <regions><region id="custom:region" legacyTemplate="SOUTH_SERDIO_0" provider="lod:region" presentationProvider="lod:region"><camera projectionDistance="320" overviewEnabled="false"><viewpoint x="0" y="1" z="2"/><refpoint x="0" y="0" z="0"/></camera><assets model="assets/map.tmd" retailAnimations="false"><textures><item value="assets/map.tim"/></textures></assets></region></regions>
</worldMapPreset>`;

describe('world map XML document and asset package', () => {
  it('round-trips nested geometry, cameras, assets and escaped metadata', () => {
    const first = parsePreset(SOURCE);
    const serialized = serializePreset(first);
    const second = parsePreset(serialized);
    expect(second.documentElement.getAttribute('name')).toBe('Test & paths');
    expect(second.querySelector('geometry points item')?.getAttribute('y')).toBe('7');
    expect(second.querySelector('camera viewpoint')?.getAttribute('z')).toBe('2');
    expect(second.querySelector('textures item')?.getAttribute('value')).toBe('assets/map.tim');
    expect(serializePreset(second)).toBe(serialized);
  });

  it('rejects malformed XML, unsupported schema versions and DTD declarations', () => {
    expect(() => parsePreset('<worldMapPreset version="1"><nodes>')).toThrow();
    expect(() => parsePreset('<worldMapPreset version="2"/>')).toThrow('version="1"');
    expect(() => parsePreset('<!DOCTYPE foo><worldMapPreset version="1"/>')).toThrow('DTD');
  });

  it('finds broken graph references while treating external providers as unresolved dependencies', () => {
    const doc = parsePreset(SOURCE);
    entries(doc, 'routes')[0].setAttribute('start', '');
    const issues = diagnostics(doc, ['assets/map.tmd', 'assets/map.tim']);
    expect(issues.some((i) => i.severity === 'error' && i.message.startsWith('start:'))).toBe(true);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('lod:region'))).toBe(true);
    expect(issues.some((i) => i.message.includes('Asset not attached'))).toBe(false);
  });

  it('preserves XML and arbitrary binary assets through compressed package export/import', () => {
    const assets = new Map([['assets/map.tim', new Uint8Array([0, 255, 16, 1, 0, 42])]]);
    const result = readPackage(writePackage(SOURCE, assets));
    expect(result.source).toBe(SOURCE);
    expect(result.assets.get('assets/map.tim')).toEqual(assets.get('assets/map.tim'));
  });

  it('rejects escaping package paths and extra preset files', () => {
    for (const path of ['../escape.tim', '/absolute.tim', 'C:/absolute.tim', 'assets/../../escape.tim', 'assets\\map.tim', 'assets:map.tim', 'assets/./map.tim'])
      expect(() => safeAssetPath(path)).toThrow();
    expect(() => writePackage(SOURCE, new Map([['other.wmap', new Uint8Array()]]))).toThrow('.wmap');
    expect(() => readPackage(zipSync({ 'other.wmap': strToU8(SOURCE) }))).toThrow('preset.wmap');
  });
});
