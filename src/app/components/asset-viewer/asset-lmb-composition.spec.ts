import { describe, expect, it } from 'vitest';
import { lmbPartSlots, resolveLmbSetups } from './asset-lmb-composition';
const op = (code: number, count: number, call = 0) => (call << 16) | (count << 8) | code;
const stor = (index: number) => 0x02000000 | index;
function bytes(words: number[]) {
  const out = new Uint8Array(words.length * 4), view = new DataView(out.buffer);
  words.forEach((word, i) => view.setUint32(i * 4, word >>> 0, true));
  return out;
}
function setup() {
  return [op(56, 2, 605), stor(18), 0x25c00,
    op(56, 2, 618), stor(18), 0x09000004, op(73, 0),
    op(49, 2), 7, stor(8), op(24, 2), 0x01000000, 0x03025c00, stor(8),
    op(56, 3, 608), stor(0), 0, stor(8), op(2, 1), 10];
}
describe('script-linked LMB setup', () => {
  it('follows the allocated child setup and expands a bounded random resource choice', () => {
    const resolved = resolveLmbSetups(bytes(setup()), 0x25c00);
    expect(resolved).toEqual([{ scriptOffset: 0, slots: { 0: Array.from({ length: 7 }, (_, i) => 0x03025c00 + i) } }]);
  });
  it('does not attach another LMB setup or guess across a conditional branch', () => {
    expect(resolveLmbSetups(bytes(setup()), 0x25c01)).toEqual([]);
    const words = setup(); words[7] = op(65, 2);
    expect(resolveLmbSetups(bytes(words), 0x25c00)).toEqual([]);
  });
  it('does not guess storage values supplied by game state', () => {
    const words = setup(); words[7] = op(8, 2); words[8] = 0x05000001;
    expect(resolveLmbSetups(bytes(words), 0x25c00)).toEqual([]);
    expect(resolveLmbSetups(bytes(setup()).subarray(0, 12), 0x25c00)).toEqual([]);
  });
  it('retains repeated part-to-slot assignments for all LMB encodings', () => {
    const type0 = bytes([0x00424d4c, 2, 3, 0, 0, 3, 0, 0]);
    expect(lmbPartSlots(type0, 0)).toEqual([3, 3]);
    const packed = bytes([0x00424d4c, 2, 0, 16, 0x02000000, 0x05000000]);
    expect(lmbPartSlots(packed, 1)).toEqual([2, 5]);
    expect(lmbPartSlots(packed, 2)).toEqual([2, 5]);
  });
});
