import { describe, expect, it } from 'vitest';
import { buildEffectScene } from './asset-effect-scene';
import { EffectRuntimeMetadata, PreviewEffect } from './asset-effect-runtime';

const effect = (age: number): PreviewEffect => ({ id: 1, kind: 'Sprite', flags: 0x4000010, slots: [], position: [10, 20, 30], rotation: [0, 0, 0], scale: [1, 1, 1], colour: [64, 96, 128], age, parent: -1, visible: true, translucency: 1, applyRotationScale: true });
const metadata: EffectRuntimeMetadata = { script: 'effect/1', flags: 0, program: { offsets: [], starts: {}, entrypoints: [], sha256: '' }, resources: [{ path: 'effect/0/sprite', flags: 0x4000010, kind: 'Sprite', offset: 16 }] };
describe('effect scene adapter', () => {
  it('loads a referenced sprite once and carries screen-facing geometry, colour and visibility into the shared stage', async () => {
    const bytes = new Uint8Array(28), view = new DataView(bytes.buffer);
    view.setUint16(16, 64, true); view.setUint16(18, 256, true);
    view.setUint16(20, 2, true); view.setUint16(22, 8, true);
    view.setUint16(24, 32, true); view.setUint16(26, 400, true);
    let reads = 0;
    const scene = await buildEffectScene({ instructions: 1, diagnostics: [], frames: [{ effects: [effect(0)] }, { effects: [effect(1)] }, { effects: [] }] }, metadata, async () => { reads++; return bytes; });
    expect(reads).toBe(1);
    expect(scene.model.parts[0].billboard).toBe(true);
    expect(scene.model.parts[0].primitives[0]).toMatchObject({ clut: (400 << 6) | 2, tpage: 49 });
    expect(scene.animation.frames[0][0]).toMatchObject({ translation: [10, 20, 30], colour: [64, 96, 128], visible: true });
    expect(scene.animation.frames[2][0].visible).toBe(false);
  });
  it('reports unresolved bindings without inventing geometry', async () => {
    const scene = await buildEffectScene({ instructions: 1, diagnostics: [], frames: [{ effects: [{ ...effect(0), flags: 123 }] }] }, metadata, async () => { throw new Error('Should not read'); });
    expect(scene.model.parts).toHaveLength(0);
    expect(scene.warnings[0]).toContain('Missing DEFF resource');
  });
});
