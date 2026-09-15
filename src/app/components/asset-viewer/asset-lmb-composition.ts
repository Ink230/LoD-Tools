import { AssetBinary } from './asset-binary';

export function lmbPartSlots(bytes: Uint8Array, type: number): number[] {
  const data = new AssetBinary(bytes), count = data.u32(4);
  if (count > 1024) throw new Error('LMB part count exceeds preview limit');
  if (type === 0) return Array.from({ length: count }, (_, i) => data.u16(8 + i * 12));
  const table = data.u32(12);
  return Array.from({ length: count }, (_, i) => data.u8(table + i * 4 + 3));
}
