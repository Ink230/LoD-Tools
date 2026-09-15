import { describe, expect, it } from 'vitest';
import { copyPaletteRow } from './asset-palette';

describe('palette row animation', () => {
  it('copies the requested row without changing the original TIM', () => {
    const bytes = new Uint8Array(28), view = new DataView(bytes.buffer);
    view.setUint32(0, 0x10, true); view.setUint32(4, 8, true);
    view.setUint16(16, 2, true); view.setUint16(18, 2, true);
    bytes.set([1, 2, 3, 4, 5, 6, 7, 8], 20);
    const result = copyPaletteRow(bytes, 1, 0);
    expect([...result.slice(20, 24)]).toEqual([5, 6, 7, 8]);
    expect([...bytes.slice(20, 24)]).toEqual([1, 2, 3, 4]);
    expect(() => copyPaletteRow(bytes, 2, 0)).toThrow('outside');
  });
});
