import { describe, expect, it } from 'vitest';
import { childTemplate, diagnostics, parsePreset, renameRegistryEntry, serializePreset } from './world-map-document';

const AUTHORED = `<worldMapPreset version="1" id="custom:world" name="Authored">
  <presentationProfiles><presentationProfile id="custom:presentation">
    <capabilities retailLabels="false" retailWater="false" retailAvatars="true"/>
    <namedTextures><item id="custom:icon"><adjustment index="0" clutX="0" clutY="0" tpageX="0" tpageY="0" mode="NONE"/></item></namedTextures>
    <namedElements><item id="custom:objective" label="Town &amp; Inn" texture="custom:icon"><position x="1.125" y="0" z="2"/></item></namedElements>
  </presentationProfile></presentationProfiles>
</worldMapPreset>`;

describe('named world-map presentation authoring', () => {
  it('round-trips named-only profiles without introducing retail tables', () => {
    const doc = parsePreset(AUTHORED);
    expect(diagnostics(doc, [])).toEqual([]);
    const restored = parsePreset(serializePreset(doc));
    expect(restored.querySelector('namedElements item')?.getAttribute('label')).toBe('Town & Inn');
    expect(restored.querySelector('namedElements position')?.getAttribute('x')).toBe('1.125');
    expect(restored.querySelector('mapPositions')).toBeNull();
    expect(restored.querySelector('capabilities')?.getAttribute('retailAvatars')).toBe('true');
  });

  it('preserves legacy layout fixtures without adding capability declarations', () => {
    const tables = [['mapPositions', 8], ['regions', 3], ['services', 5], ['waterClutYs', 14], ['playerAvatarVramSlots', 4], ['textureAdjustments', 22]] as const;
    const source = tables.map(([name, length]) => `<${name}>${Array.from({ length }, () => name === 'mapPositions' ? '<item x="0" y="0" z="0"/>' : name === 'textureAdjustments' ? '<item index="0" clutX="0" clutY="0" tpageX="0" tpageY="0" mode="NONE"/>' : '<item value="0"/>').join('')}</${name}>`).join('');
    const doc = parsePreset(`<worldMapPreset version="1" id="custom:legacy"><presentationProfiles><presentationProfile id="custom:layout">${source}</presentationProfile></presentationProfiles></worldMapPreset>`);
    expect(diagnostics(doc, [])).toEqual([]);
    const roundtrip = parsePreset(serializePreset(doc));
    expect(roundtrip.querySelector('capabilities')).toBeNull();
    expect(roundtrip.querySelectorAll('textureAdjustments item')).toHaveLength(22);
  });

  it('updates local references when a named texture is renamed', () => {
    const doc = parsePreset(AUTHORED);
    renameRegistryEntry(doc.querySelector('namedTextures item')!, 'custom:renamed');
    expect(doc.querySelector('namedElements item')?.getAttribute('texture')).toBe('custom:renamed');
    expect(diagnostics(doc, [])).toEqual([]);
  });

  it('reports unknown references, duplicate identities and invalid coordinates', () => {
    const doc = parsePreset(AUTHORED);
    const element = doc.querySelector('namedElements item')!;
    element.setAttribute('texture', 'custom:missing');
    element.querySelector('position')!.setAttribute('x', 'NaN');
    element.parentElement!.appendChild(element.cloneNode(true));
    const messages = diagnostics(doc, []).map((issue) => issue.message);
    expect(messages.some((message) => message.includes('Unknown named texture'))).toBe(true);
    expect(messages.some((message) => message.includes('Duplicate namedElements'))).toBe(true);
    expect(messages.some((message) => message.includes('finite position'))).toBe(true);
  });

  it('creates presentation capability objects rather than travel capability lists', () => {
    const profile = parsePreset(AUTHORED).querySelector('presentationProfile')!;
    expect(childTemplate(profile, 'capabilities')).toBe('<capabilities retailLabels="false" retailWater="false" retailAvatars="false"/>');
    expect(childTemplate(profile, 'namedElements')).toBe('<namedElements/>');
  });
});
