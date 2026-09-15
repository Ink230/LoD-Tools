import { describe, expect, it } from 'vitest';
import { decodeEnvironment } from './asset-scene';

describe('decodeEnvironment', () => {
  it('reads the SC submap camera and tile placement records', () => {
    const bytes = new Uint8Array(0x3c);
    const view = new DataView(bytes.buffer);
    view.setInt16(0, 100, true);
    view.setInt16(8, -50, true);
    view.setUint16(0x10, 320, true);
    view.setInt16(0x12, 2, true);
    view.setUint8(0x14, 1);
    view.setInt16(0x18, 20, true);
    view.setInt16(0x1e, 7, true);
    view.setUint16(0x38, 0x123, true);
    const scene = decodeEnvironment(bytes);
    expect(scene.camera).toEqual({ position: [100, 0, 0], target: [-50, 0, 0], projectionDistance: 320, rotation: 2 });
    expect(scene.records[0]).toMatchObject({ label: 'Environment texture 0', values: { worldX: 20, tileType: 7, tpage: 0x123 } });
  });
});
