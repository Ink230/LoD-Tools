import { describe, expect, it } from 'vitest';
import { lmbPartSlots } from './asset-lmb-composition';
function bytes(words: number[]) {
  const out = new Uint8Array(words.length * 4), view = new DataView(out.buffer);
  words.forEach((word, i) => view.setUint32(i * 4, word >>> 0, true));
  return out;
}
describe('LMB part slots', () => {
  it('retains repeated part-to-slot assignments for all LMB encodings', () => {
    const type0 = bytes([0x00424d4c, 2, 3, 0, 0, 3, 0, 0]);
    expect(lmbPartSlots(type0, 0)).toEqual([3, 3]);
    const packed = bytes([0x00424d4c, 2, 0, 16, 0x02000000, 0x05000000]);
    expect(lmbPartSlots(packed, 1)).toEqual([2, 5]);
    expect(lmbPartSlots(packed, 2)).toEqual([2, 5]);
  });
});
