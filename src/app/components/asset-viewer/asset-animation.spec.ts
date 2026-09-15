import { describe, expect, it } from 'vitest';
import { decodeAnimation, decodeAnm, decodeClutAnimation, decodeClutAnimationDetails, decodeLmb } from './asset-animation';

describe('asset animation decoders', () => {
  it('decodes standard keyframes at half the 30 Hz engine tick rate', () => {
    const bytes = bytesOf(40, (view) => {
      view.setUint16(12, 1, true);
      view.setInt16(14, 2, true);
      view.setInt16(16, 1024, true);
      view.setInt16(22, 100, true);
    });
    const animation = decodeAnimation(bytes);
    expect(animation).toMatchObject({ format: 'TMD animation', fps: 15 });
    expect(animation.frames).toEqual([[{ scale: [1, 1, 1], rotation: [Math.PI / 2, 0, 0], translation: [100, 0, 0] }]]);
  });

  it('accumulates CMB delta transforms from its base keyframe', () => {
    const bytes = bytesOf(36, (view) => {
      view.setUint32(0, 0x20424d43, true);
      view.setUint16(12, 1, true);
      view.setUint16(14, 2, true);
      view.setInt16(22, 10, true);
      view.setUint8(28, 1);
      view.setInt8(29, 2);
      view.setUint8(32, 2);
      view.setInt8(33, 3);
    });
    const animation = decodeAnimation(bytes);
    expect(animation.format).toBe('CMB');
    expect(animation.fps).toBe(15);
    expect(animation.frames).toHaveLength(2);
    expect(animation.frames[1][0].rotation[0]).toBe(Math.PI / 512);
    expect(animation.frames[1][0].translation).toEqual([22, 0, 0]);
  });

  it('decodes LMB 0 absolute transforms', () => {
    const bytes = bytesOf(64, (view) => {
      view.setUint32(0, 0x00424d4c, true);
      view.setInt32(4, 1, true);
      view.setInt16(12, 2, true);
      view.setUint32(16, 24, true);
      writeLmbTransform(view, 24, 4096, 1, 2, 3, 1024);
      writeLmbTransform(view, 44, 8192, 4, 5, 6, 2048);
    });
    const animation = decodeLmb(bytes, 0);
    expect(animation.frames).toHaveLength(2);
    expect(animation.frames[1][0]).toMatchObject({ scale: [2, 2, 2], translation: [4, 5, 6], rotation: [Math.PI, 0, 0] });
  });

  it('decodes LMB 1 sparse absolute values and LMB 2 packed deltas', () => {
    const lmb1 = bytesOf(70, (view) => {
      view.setUint32(0, 0x00424d4c, true);
      view.setInt32(4, 1, true);
      view.setInt16(8, 18, true);
      view.setInt16(10, 2, true);
      view.setUint32(12, 24, true);
      view.setUint32(16, 28, true);
      view.setUint32(20, 48, true);
      view.setUint16(24, 0x007f, true);
      writeLmbTransform(view, 28, 4096, 0, 0, 0, 0);
      [2, 3, 4, 10, 11, 12, 1024, 0, 0].forEach((value, index) => view.setInt16(48 + index * 2, value, true));
    });
    expect(decodeLmb(lmb1, 1).frames[1][0]).toMatchObject({ scale: [2, 3, 4], translation: [10, 11, 12], rotation: [Math.PI / 2, 0, 0] });

    const lmb2 = bytesOf(54, (view) => {
      view.setUint32(0, 0x00424d4c, true);
      view.setInt32(4, 1, true);
      view.setInt16(8, 6, true);
      view.setInt16(10, 2, true);
      view.setUint32(12, 24, true);
      view.setUint32(16, 28, true);
      view.setUint32(20, 48, true);
      view.setUint32(24, 0x007f, true);
      writeLmbTransform(view, 28, 4096, 0, 0, 0, 0);
      [0x01, 0x23, 0x05, 0x67, 0x01, 0x23].forEach((value, index) => view.setUint8(48 + index, value));
    });
    const transform = decodeLmb(lmb2, 2).frames[1][0];
    expect(transform.scale).toEqual([2, 3, 4]);
    expect(transform.translation).toEqual([5, 6, 7]);
    expect(transform.rotation).toEqual([Math.PI / 2048, Math.PI / 1024, (3 * Math.PI) / 2048]);
  });

  it('decodes ANM sequences and CLUT palette-copy instructions', () => {
    const anm = bytesOf(44, (view) => {
      view.setUint16(4, 1, true);
      view.setUint16(6, 1, true);
      view.setUint8(10, 2);
      view.setUint16(12, 10, true);
      view.setUint16(14, 20, true);
      view.setUint32(16, 20, true);
      view.setInt32(20, 1, true);
      view.setUint8(24, 4);
      view.setUint8(25, 5);
      view.setUint16(28, 0x1234, true);
      view.setUint16(30, 0x0020, true);
      view.setUint16(32, 8, true);
      view.setUint16(34, 9, true);
      view.setUint16(36, 1024, true);
      view.setUint16(40, 1, true);
      view.setUint16(42, 2, true);
    });
    const sprite = decodeAnm(anm);
    expect(sprite.frames[0]).toMatchObject({ duration: 2, pieces: [{ x: -4, y: 0, u: 4, v: 5, clut: 0x1234, tpage: 0x20, rotation: Math.PI / 2, flipX: false, flipY: false }] });

    const clut = bytesOf(12, (view) => {
      view.setInt16(2, 7, true);
      view.setInt16(4, 12, true);
      view.setInt16(6, 3, true);
      view.setInt16(8, -1, true);
    });
    expect(decodeClutAnimation(clut)).toMatchObject({ fps: 30, frames: [[12, 3]] });
    expect(decodeClutAnimationDetails(clut)).toMatchObject({ targetClutIndex: 7, steps: [{ sourceYOffset: 12, durationTicks: 3 }] });

    const container = bytesOf(40, (view) => {
      view.setUint32(0, 0xffff_ffff, true);
      view.setUint32(4, 20, true);
      view.setUint32(8, 0xffff_ffff, true);
      view.setUint32(12, 0xffff_ffff, true);
      view.setInt16(22, 6, true);
      view.setInt16(24, 64, true);
      view.setInt16(26, 0, true);
      view.setInt16(28, 56, true);
      view.setInt16(30, -1, true);
    });
    expect(decodeClutAnimationDetails(container)).toMatchObject({ targetClutIndex: 6, steps: [{ sourceYOffset: 64, durationTicks: 0 }] });
  });

  it('rejects malformed headers and an untyped LMB', () => {
    expect(() => decodeAnimation(new Uint8Array(3))).toThrow('Truncated');
    expect(() => decodeAnimation(bytesOf(8, (view) => view.setUint32(0, 0x00424d4c, true)))).toThrow('subtype');
    expect(() => decodeAnm(bytesOf(8, (view) => view.setUint16(6, 1, true)))).toThrow('Truncated');
  });
});

function bytesOf(length: number, write: (view: DataView) => void): Uint8Array {
  const bytes = new Uint8Array(length);
  write(new DataView(bytes.buffer));
  return bytes;
}

function writeLmbTransform(view: DataView, offset: number, scale: number, x: number, y: number, z: number, rotation: number): void {
  view.setInt16(offset, scale, true);
  view.setInt16(offset + 2, scale, true);
  view.setInt16(offset + 4, scale, true);
  view.setInt16(offset + 6, x, true);
  view.setInt16(offset + 8, y, true);
  view.setInt16(offset + 10, z, true);
  view.setInt16(offset + 12, rotation, true);
}
