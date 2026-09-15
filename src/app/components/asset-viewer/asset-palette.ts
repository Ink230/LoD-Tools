import { AssetBinary } from './asset-binary';

/** Models.animateModelClut copies a complete palette row at the TIM's CLUT origin. */
export function copyPaletteRow(bytes: Uint8Array, sourceRow: number, targetRow: number): Uint8Array {
  const data = new AssetBinary(bytes);
  if (data.u32(0) !== 0x10 || !(data.u32(4) & 8)) throw new Error('Palette animation requires a TIM with a CLUT');
  const width = data.u16(16), height = data.u16(18);
  if (!Number.isInteger(sourceRow) || !Number.isInteger(targetRow) || sourceRow < 0 || targetRow < 0 || sourceRow >= height || targetRow >= height) throw new Error('Palette animation row is outside this TIM. Choose its companion texture.');
  const rowBytes = width * 2;
  data.check(20, rowBytes * height);
  const result = bytes.slice();
  result.set(bytes.subarray(20 + sourceRow * rowBytes, 20 + (sourceRow + 1) * rowBytes), 20 + targetRow * rowBytes);
  return result;
}
