import { describe, expect, it } from 'vitest';
import { decodeSubmapComposition, renderSubmapComposition } from './asset-submap';

function fixture() {
  const env = new Uint8Array(96);
  const data = new DataView(env.buffer);
  env[20] = 2; env[21] = 1;
  for (const offset of [24, 60]) {
    data.setUint16(offset + 12, 2, true);
    data.setUint16(offset + 14, 1, true);
    data.setInt16(offset + 16, -2, true);
  }
  data.setUint16(60 + 8, 2, true);
  const tim = new Uint8Array(28);
  const t = new DataView(tim.buffer);
  t.setUint32(0, 16, true); t.setUint32(4, 2, true);
  t.setUint32(8, 20, true); t.setUint16(16, 4, true); t.setUint16(18, 1, true);
  [31, 31, 0, 992].forEach((color, i) => t.setUint16(20 + i * 2, color, true));
  return { env, tim };
}

describe('submap composition', () => {
  it('places cropped layers at normalized screen coordinates and preserves transparent cutouts', () => {
    const { env, tim } = fixture();
    const scene = decodeSubmapComposition(env, [tim]);
    expect([scene.width, scene.height]).toEqual([2, 1]);
    expect(scene.layers.map(layer => layer.foreground)).toEqual([false, true]);
    expect([...renderSubmapComposition(scene, new Set()).pixels]).toEqual([248, 0, 0, 255, 0, 248, 0, 255]);
    expect([...renderSubmapComposition(scene, new Set([1])).pixels]).toEqual([248, 0, 0, 255, 248, 0, 0, 255]);
  });
  it('reports missing texture pages without inventing image data', () => {
    const { env } = fixture();
    const scene = decodeSubmapComposition(env, []);
    expect(scene.layers).toHaveLength(0);
    expect(scene.warnings).toHaveLength(2);
  });
  it('rejects truncated environment records', () => {
    expect(() => decodeSubmapComposition(fixture().env.subarray(0, 30), [])).toThrow();
  });
});
