import { describe, expect, it } from 'vitest';
import { diagnostics, entries, parsePreset, renameRegistryEntry, serializePreset } from './world-map-document';
import { readPackage, safeAssetPath, writePackage } from './world-map-package';
import { strToU8, zipSync } from 'fflate';

const SOURCE = `<worldMapPreset version="1" id="custom:test" name="Test &amp; paths">
  <nodes><node id="custom:a"><position x="0" y="7" z="0"/></node><node id="custom:b"><position x="100" y="9" z="50"/></node></nodes>
  <geometry><geometry id="custom:path" legacyIndex="-1"><points><item x="0" y="7" z="0"/><item x="100" y="9" z="50"/></points></geometry></geometry>
  <routes><route id="custom:route" legacyIndex="-1" start="custom:a" end="custom:b" geometry="custom:path" direction="1" encounterRate="0" battleStage="0" modelIndex="0" legacyEncounterPlaceholder="0"/></routes>
  <regions><region id="custom:region" legacyTemplate="SOUTH_SERDIO_0" provider="lod:region" presentationProvider="lod:region"><camera projectionDistance="320" overviewEnabled="false"><viewpoint x="0" y="1" z="2"/><refpoint x="0" y="0" z="0"/></camera><assets model="assets/map.tmd" retailAnimations="false"><textures><item value="assets/map.tim"/></textures></assets></region></regions>
</worldMapPreset>`;

describe('world map XML document and asset package', () => {
  it('preserves string destination names and accepts valid legacy enum names', () => {
    for (const type of ['string', 'enum']) {
      const doc = parsePreset(`<worldMapPreset version="1" id="custom:test"><submapDestinations><submapDestination id="custom:spawn" cut="2" scene="0"><data type="${type}" value="CUSTOM_SPAWN"/></submapDestination></submapDestinations></worldMapPreset>`);
      const imported = parsePreset(serializePreset(doc));
      expect(diagnostics(imported, [])).toEqual([]);
      expect(imported.querySelector('data').getAttribute('value')).toBe('CUSTOM_SPAWN');
      expect(imported.querySelector('data').getAttribute('type')).toBe(type);
      imported.querySelector('data').setAttribute('value', 'not an identifier');
      const messages = diagnostics(imported, []).map((issue) => issue.message);
      expect(messages).toEqual(type === 'enum' ? ['Legacy enum data requires a symbolic identifier'] : []);
    }
  });

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
    expect(issues.some((i) => i.severity === 'error' && i.message.startsWith('Missing nodes reference') && i.message.includes('(start)'))).toBe(true);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('lod:region'))).toBe(true);
    expect(issues.some((i) => i.message.includes('Asset not attached'))).toBe(false);
  });

  it('resolves modern authoring references and validates reusable definitions', () => {
    const doc = parsePreset(`<worldMapPreset version="1" id="custom:modern" name="Modern">
      <places><place id="custom:place" legacyIndex="-1" thumbnail="0" services="0" thumbnailId="custom:thumbnail"><serviceIds><item id="custom:service"/></serviceIds><soundIds><item id="custom:sound"/></soundIds><sounds/></place></places>
      <routes><route id="custom:route" legacyIndex="-1" start="custom:a" end="custom:b" geometry="custom:path" direction="1" encounterRate="0" battleStage="0" modelIndex="0" legacyEncounterPlaceholder="-1" battleStageId="custom:stage"/></routes>
      <portals><portal id="custom:portal" legacyIndex="-1" junctionIndex="-1" continent="SOUTH_SERDIO_0" fullBrightness="false" effectFlags="0" atmosphere="SNOW" smoke="MODE_1" fromId="custom:from" toId="custom:to"><from cut="0" scene="0"/><to cut="0" scene="0"/></portal></portals>
      <thumbnailDefinitions><thumbnailDefinition id="custom:thumbnail" nativeIndex="-1" asset="assets/thumb.tim" label="Custom thumbnail"/></thumbnailDefinitions>
      <serviceDefinitions><serviceDefinition id="custom:service" label="Save point"/></serviceDefinitions>
      <soundDefinitions><soundDefinition id="custom:sound" nativeIndex="4" label="Town ambience"/></soundDefinitions>
      <battleStageDefinitions><battleStageDefinition id="custom:stage" nativeIndex="-1" label="Default world-map stage"/></battleStageDefinitions>
      <submapDestinations><submapDestination id="custom:from" cut="1" scene="2" label="Arrival"/><submapDestination id="custom:to" cut="3" scene="4" label="Departure"/></submapDestinations>
    </worldMapPreset>`);

    const issues = diagnostics(doc, ['assets/thumb.tim'], {
      nodes: ['custom:a', 'custom:b'],
      geometry: ['custom:path'],
    });
    expect(issues).toEqual([]);
    expect(entries(doc, 'thumbnailDefinitions')[0].getAttribute('label')).toBe('Custom thumbnail');
    expect(serializePreset(parsePreset(serializePreset(doc)))).toBe(serializePreset(doc));
  });

  it('reports invalid modern definitions and typed portal effects', () => {
    const doc = parsePreset(`<worldMapPreset version="1" id="custom:invalid">
      <portals><portal id="custom:portal" atmosphere="RAIN" smoke="LOTS"/></portals>
      <thumbnailDefinitions><thumbnailDefinition id="custom:thumbnail"/></thumbnailDefinitions>
      <soundDefinitions><soundDefinition id="custom:sound" nativeIndex="0"/></soundDefinitions>
      <battleStageDefinitions><battleStageDefinition id="custom:stage" nativeIndex="1.5"/></battleStageDefinitions>
      <submapDestinations><submapDestination id="custom:destination" cut="2.5" scene=""/></submapDestinations>
    </worldMapPreset>`);
    const messages = diagnostics(doc, []).map((issue) => issue.message);
    expect(messages).toContain('atmosphere must be NONE, CLOUDS or SNOW');
    expect(messages).toContain('smoke must be NONE, MODE_1 or MODE_2');
    expect(messages).toContain('Thumbnail definitions require a native index of -1 or greater');
    expect(messages).toContain('Thumbnail definitions require exactly one native index, packaged asset or provider');
    expect(messages).toContain('Sound definitions require a positive integer native index');
    expect(messages).toContain('Battle-stage definitions require an integer native index of -1 or greater');
    expect(messages).toContain('Submap destinations require integer cut and scene numbers');
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
  it('resolves native encounter registries outside editable preset sections', () => {
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><encounterPools><encounterPool id="custom:pool"><encounters><item id="lod:sea_dragon"/><item id="lod:sea_dragon"/><item id="lod:sea_dragon"/><item id="lod:sea_dragon"/></encounters></encounterPool></encounterPools></worldMapPreset>');
    expect(diagnostics(doc, [], { encounters: ['lod:sea_dragon'] })).toEqual([]);
    const unresolved = diagnostics(doc, []);
    expect(unresolved.some((issue) => issue.message.includes('Unknown encounters reference "lod:sea_dragon"') && issue.message.includes('Choose an existing encounters ID'))).toBe(true);
  });

  it('preserves omitted lighting and encounter percentages while validating authored values', () => {
    const oldPreset = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera projectionDistance="320"><viewpoint x="0" y="0" z="0"/><refpoint x="0" y="0" z="0"/></camera></region></regions><encounterPools><encounterPool id="custom:pool"><encounters><item id="lod:a"/><item id="lod:b"/><item id="lod:c"/><item id="lod:d"/></encounters></encounterPool></encounterPools></worldMapPreset>');
    expect(oldPreset.querySelector('lighting')).toBeNull();
    expect(oldPreset.querySelector('percentages')).toBeNull();
    expect(diagnostics(oldPreset, [], { encounters: ['lod:a', 'lod:b', 'lod:c', 'lod:d'] })).toEqual([]);
    expect(parsePreset(serializePreset(oldPreset)).querySelector('lighting')).toBeNull();

    const flatBounds = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera projectionDistance="320"><viewpoint x="0" y="0" z="0"/><refpoint x="0" y="0" z="0"/><minimum x="1" y="0" z="0"/><maximum x="1" y="1" z="1"/></camera></region></regions></worldMapPreset>');
    expect(diagnostics(flatBounds, [])).toEqual([]);

    const invalid = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera projectionDistance="0"><viewpoint x="0" y="0" z="0"/><refpoint x="0" y="0" z="0"/><minimum x="2" y="0" z="0"/><maximum x="1" y="1" z="1"/><lighting overviewBrightness="2" transitionBrightness="0" transitionStep="0"><ambient x="1.1" y="0" z="0"/><lights><item><direction x="0" y="0" z="0"/><colour x="2" y="0" z="0"/></item></lights></lighting></camera></region></regions><encounterPools><encounterPool id="custom:pool"><encounters><item id="lod:a"/><item id="lod:b"/><item id="lod:c"/><item id="lod:d"/></encounters><percentages><item value="50"/><item value="20"/><item value="20"/><item value="20"/></percentages></encounterPool></encounterPools></worldMapPreset>');
    const messages = diagnostics(invalid, [], { encounters: ['lod:a', 'lod:b', 'lod:c', 'lod:d'] }).map((issue) => issue.message);
    expect(messages).toContain('Camera projection distance must be positive');
    expect(messages).toContain('Camera minimum bounds must not exceed maximum bounds on any axis');
    expect(messages).toContain('Lighting overview brightness must be finite from 0 through 1');
    expect(messages).toContain('Lighting transition brightness must be finite from overview brightness through 1');
    expect(messages).toContain('Lighting transition step must be positive and finite');
    expect(messages).toContain('Lighting ambient RGB components must be finite from 0 through 1');
    expect(messages).toContain('Lighting requires exactly three lights with finite nonzero directions and RGB colours from 0 through 1');
    expect(messages).toContain('Encounter percentages require exactly four integer values from 0 through 100 totaling 100');

    const missingValues = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera projectionDistance="320"><viewpoint x="0" y="0" z="0"/><refpoint x="0" y="0" z="0"/><lighting overviewBrightness="" transitionStep="NaN"><ambient x="" y="0" z="0"/><lights><item><direction x="1" z="0"/><colour x="0" y="0"/></item><item><direction x="1" y="0" z="0"/><colour x="0" y="0" z="0"/></item><item><direction x="1" y="0" z="0"/><colour x="0" y="0" z="0"/></item></lights></lighting></camera></region></regions><encounterPools><encounterPool id="custom:pool"><encounters><item id="lod:a"/><item id="lod:b"/><item id="lod:c"/><item id="lod:d"/></encounters><percentages><item value="35.0"/><item value="3.5e1"/><item value=""/></percentages></encounterPool></encounterPools></worldMapPreset>');
    const missingMessages = diagnostics(missingValues, [], { encounters: ['lod:a', 'lod:b', 'lod:c', 'lod:d'] }).map((issue) => issue.message);
    expect(missingMessages).toContain('Lighting overview brightness must be finite from 0 through 1');
    expect(missingMessages).toContain('Lighting transition brightness must be finite from overview brightness through 1');
    expect(missingMessages).toContain('Lighting transition step must be positive and finite');
    expect(missingMessages).toContain('Lighting ambient RGB components must be finite from 0 through 1');
    expect(missingMessages).toContain('Lighting requires exactly three lights with finite nonzero directions and RGB colours from 0 through 1');
    expect(missingMessages).toContain('Encounter percentages require exactly four integer values from 0 through 100 totaling 100');

    const endpointValues = parsePreset('<worldMapPreset version="1" id="custom:test"><regions><region id="custom:region"><camera projectionDistance="320"><viewpoint x="0" y="0" z="0"/><refpoint x="0" y="0" z="0"/><lighting overviewBrightness="0" transitionBrightness="1" transitionStep="0.1"><ambient x="0" y="0" z="0"/><lights><item><direction x="1" y="0" z="0"/><colour x="1" y="1" z="1"/></item><item><direction x="1" y="0" z="0"/><colour x="1" y="1" z="1"/></item><item><direction x="1" y="0" z="0"/><colour x="1" y="1" z="1"/></item></lights></lighting></camera></region></regions><encounterPools><encounterPool id="custom:pool"><encounters><item id="lod:a"/><item id="lod:b"/><item id="lod:c"/><item id="lod:d"/></encounters><percentages><item value="0"/><item value="0"/><item value="0"/><item value="100"/></percentages></encounterPool></encounterPools></worldMapPreset>');
    expect(diagnostics(endpointValues, [], { encounters: ['lod:a', 'lod:b', 'lod:c', 'lod:d'] })).toEqual([]);
  });
  it('renames typed references without changing matching IDs in other registries', () => {
    const doc = parsePreset(SOURCE);
    entries(doc, 'routes')[0].setAttribute('avatar', 'custom:a');
    renameRegistryEntry(entries(doc, 'nodes')[0], 'custom:renamed');
    expect(entries(doc, 'routes')[0].getAttribute('start')).toBe('custom:renamed');
    expect(entries(doc, 'routes')[0].getAttribute('avatar')).toBe('custom:a');
    expect(() => renameRegistryEntry(entries(doc, 'nodes')[0], 'custom:b')).toThrow('already exists');
    expect(entries(doc, 'routes')[0].getAttribute('start')).toBe('custom:renamed');
  });
  it('renames portal references in rules and teleport links', () => {
    const doc = parsePreset('<worldMapPreset version="1" id="custom:test"><portals><portal id="custom:a"/></portals><rules><portals><portal id="custom:a"/></portals></rules><teleportLinks><teleportLink id="custom:link" source="custom:a" destination="custom:a"/></teleportLinks></worldMapPreset>');
    renameRegistryEntry(entries(doc, 'portals')[0], 'custom:b');
    expect(doc.querySelector('rules portal').getAttribute('id')).toBe('custom:b');
    expect(doc.querySelector('teleportLink').getAttribute('source')).toBe('custom:b');
    expect(doc.querySelector('teleportLink').getAttribute('destination')).toBe('custom:b');
  });
});
