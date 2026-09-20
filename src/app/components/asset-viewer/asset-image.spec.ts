import { describe, expect, it } from 'vitest';
import { decodeMcq, decodeTim, decodeAssetTim, sampleTim, texturePage, texturePageFromTims, textureCoversPrimitive, submapTextureAtOrigin } from './asset-image';

function u16(bytes: Uint8Array, offset: number, value: number) { new DataView(bytes.buffer).setUint16(offset, value, true); }
function u32(bytes: Uint8Array, offset: number, value: number) { new DataView(bytes.buffer).setUint32(offset, value, true); }

function tim(bpp: 0 | 1 | 2 | 3, words: number, image: number[], clut?: number[]) {
  const hasClut = clut !== undefined;
  const clutBytes = hasClut ? 12 + clut.length * 2 : 0;
  const imageOffset = 8 + clutBytes;
  const bytes = new Uint8Array(imageOffset + 12 + image.length);
  u32(bytes, 0, 0x10);
  u32(bytes, 4, bpp | (hasClut ? 8 : 0));
  if (hasClut) {
    u32(bytes, 8, clutBytes);
    u16(bytes, 16, clut.length);
    u16(bytes, 18, 1);
    clut.forEach((colour, index) => u16(bytes, 20 + index * 2, colour));
  }
  u32(bytes, imageOffset, 12 + image.length);
  u16(bytes, imageOffset + 8, words);
  u16(bytes, imageOffset + 10, 1);
  bytes.set(image, imageOffset + 12);
  return bytes;
}

describe('asset image decoders', () => {
  it('uses embedded overlay palettes without inventing palettes for other TIMs', () => {
    const bytes = tim(0, 16, Array(4096).fill(0));
    u16(bytes, 18, 128);
    bytes[20] = 0x11;
    bytes[20 + 111 * 32] = 0x11;
    u16(bytes, 20 + 112 * 32 + 2, 0x001f);
    u16(bytes, 20 + 113 * 32 + 2, 0x03e0);
    const original = bytes.slice();
    const image = decodeAssetTim(bytes, 'SECT/DRGN0.BIN/7017/0');
    expect(image).toMatchObject({ width: 64, height: 112, paletteCount: 16 });
    expect(image.pixels.length).toBe(64 * 112 * 4);
    expect([...image.pixels.slice(111 * 64 * 4, 111 * 64 * 4 + 4)]).toEqual([248, 0, 0, 255]);
    expect([...image.pixels.slice(0, 4)]).toEqual([248, 0, 0, 255]);
    expect([...decodeAssetTim(bytes, 'SECT/DRGN0.BIN/7017/0', 1).pixels.slice(0, 4)]).toEqual([0, 248, 0, 255]);
    expect(bytes).toEqual(original);
    expect(decodeAssetTim(bytes, 'SECT/DRGN0.BIN/7017/0', 15)).toMatchObject({ height: 112, paletteCount: 16, paletteIndex: 15 });
    expect(() => decodeAssetTim(bytes, 'unrelated.tim')).toThrow('missing a CLUT');
    expect(() => decodeAssetTim(bytes, 'SECT/DRGN0.BIN/7017/0', 16)).toThrow('out of range');
    expect(() => decodeAssetTim(tim(0, 1, [0, 0]), 'SECT/DRGN0.BIN/7017/0')).toThrow('Invalid submap overlay');
  });

  it('uploads palette-less pixels when another VRAM resource provides the palette', () => {
    const pixels = tim(0, 1, [0x11, 0x11]);
    u16(pixels, 12, 64);
    const palette = tim(2, 16, Array(32).fill(0));
    u16(palette, 22, 0x001f);
    const page = texturePageFromTims([pixels, palette], 0, 1);
    expect([...page.pixels.slice(0, 4)]).toEqual([248, 0, 0, 255]);
    expect(page.coverage[0]).toBe(1);
  });

  it('relocates a submap texture without modifying the source bytes', () => {
    const bytes = tim(0, 1, [0x11, 0x11], Array.from({ length: 16 }, (_, i) => i === 1 ? 0x001f : 0));
    u16(bytes, 12, 576); u16(bytes, 14, 368);
    u16(bytes, 56, 576); u16(bytes, 58, 256);
    const before = [...bytes];
    const moved = submapTextureAtOrigin(bytes);
    const page = texturePageFromTims([moved], (0x5c24 & 0x3c3) | (112 << 6), 0x19 & 0xffe0);
    expect([...page.pixels.slice(0, 4)]).toEqual([248, 0, 0, 255]);
    expect(page.coverage[0]).toBe(1);
    expect([...bytes]).toEqual(before);
  });
  it('distinguishes missing texture uploads from valid transparent texels', () => {
    const bytes = tim(0, 1, [0, 0], Array(16).fill(0));
    u16(bytes, 56, 64);
    const page = texturePageFromTims([bytes], 0, 1);
    expect(page.pixels[3]).toBe(0);
    expect(page.coverage[0]).toBe(1);
    expect(textureCoversPrimitive(page.coverage, [[0, 0], [3, 0], [0, 0]])).toBe(true);
    expect(texturePageFromTims([bytes], 0, 2).coverage[0]).toBe(0);
    expect(texturePageFromTims([bytes], 64, 1).coverage[0]).toBe(0);
  });

  it('detects missing interior UV data even when triangle corners are uploaded', () => {
    const coverage = new Uint8Array(256 * 256).fill(1);
    coverage[257] = 0;
    expect(textureCoversPrimitive(coverage, [[0, 0], [4, 0], [0, 4]])).toBe(false);
    coverage[257] = 1;
    expect(textureCoversPrimitive(coverage, [[0, 0], [4, 0], [0, 4]])).toBe(true);
  });
  it('decodes paletted, direct-colour, and 24-bit TIM images', () => {
    const palette = Array.from({ length: 16 }, (_, index) => index === 1 ? 0x7fff : 0);
    const fourBit = decodeTim(tim(0, 1, [0x11, 0x11], palette));
    expect(fourBit).toMatchObject({ format: 'TIM', bpp: 4, width: 4, height: 1, paletteCount: 1 });
    expect(Array.from(fourBit.pixels.slice(0, 4))).toEqual([248, 248, 248, 255]);

    const eightBitPalette = Array.from({ length: 256 }, (_, index) => index === 2 ? 0x03e0 : 0);
    expect(Array.from(decodeTim(tim(1, 1, [2, 2], eightBitPalette)).pixels.slice(0, 4))).toEqual([0, 248, 0, 255]);
    expect(Array.from(decodeTim(tim(2, 1, [0x1f, 0])).pixels.slice(0, 4))).toEqual([248, 0, 0, 255]);
    expect(Array.from(decodeTim(tim(3, 3, [1, 2, 3, 4, 5, 6])).pixels)).toEqual([1, 2, 3, 255, 4, 5, 6, 255]);
  });

  it('samples PSX texture pages using packed tpage and CLUT coordinates', () => {
    const palette = Array.from({ length: 16 }, (_, index) => index === 1 ? 0x001f : 0);
    const bytes = tim(0, 1, [0x11, 0x11], palette);
    expect(sampleTim(bytes, 0, 0, 0, 0)).toEqual([248, 0, 0, 255]);
    expect(sampleTim(bytes, 4, 0, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(texturePage(bytes, 0, 0)).toMatchObject({ width: 256, height: 256 });
  });

  it('treats zero as transparent, STP as translucent, and exposes every CLUT palette group', () => {
    const palette = Array.from({ length: 32 }, (_, index) => index === 1 ? 0x7fff : index === 17 ? 0x801f : 0);
    const bytes = tim(0, 1, [0x11, 0x11], palette);
    expect(decodeTim(bytes)).toMatchObject({ paletteCount: 2 });
    expect(Array.from(decodeTim(bytes, 0).pixels.slice(0, 4))).toEqual([248, 248, 248, 255]);
    expect(Array.from(decodeTim(bytes, 1).pixels.slice(0, 4))).toEqual([248, 0, 0, 128]);
    expect(sampleTim(bytes, 4, 0, 0, 0)).toEqual([0, 0, 0, 0]);
  });

  it('uses a shared VRAM when palette and texture TIMs are loaded separately', () => {
    const transparentPalette = Array.from({ length: 16 }, () => 0);
    const redPalette = Array.from({ length: 16 }, (_, index) => index === 1 ? 0x001f : 0);
    const imageTim = tim(0, 1, [0x11, 0x11], transparentPalette);
    u16(imageTim, 56, 64); // TIM image X and tpage 1 are both VRAM-word coordinates
    const paletteTim = tim(0, 1, [0, 0], redPalette);
    u16(paletteTim, 56, 100); // Its placeholder image must not overwrite the first TIM's texture page
    const page = texturePageFromTims([imageTim, paletteTim], 0, 1);
    expect(Array.from(page.pixels.slice(0, 4))).toEqual([248, 0, 0, 255]);
  });

  it('uses TPage origins as VRAM words at non-zero X and Y coordinates', () => {
    const palette = Array.from({ length: 16 }, (_, index) => index === 1 ? 0x001f : index === 2 ? 0x03e0 : 0);
    const bytes = tim(0, 1, [0x21, 0x11], palette);
    u16(bytes, 14, 256); // CLUT Y
    u16(bytes, 56, 512); // Image X is in VRAM words
    u16(bytes, 58, 256); // Image Y
    const clut = 256 << 6;
    const tpage = 24; // Page X 512 words and page Y 256
    expect(sampleTim(bytes, 0, 0, clut, tpage)).toEqual([248, 0, 0, 255]);
    expect(sampleTim(bytes, 1, 0, clut, tpage)).toEqual([0, 248, 0, 255]);
    const page = texturePageFromTims([bytes], clut, tpage);
    expect(Array.from(page.pixels.slice(0, 8))).toEqual([248, 0, 0, 255, 0, 248, 0, 255]);
  });

  it('reconstructs an MCQ tile with McqBuilder CLUT addressing', () => {
    const imageOffset = 0x2c;
    const vramWidth = 64;
    const vramHeight = 16;
    const bytes = new Uint8Array(imageOffset + vramWidth * vramHeight * 2);
    u32(bytes, 0, 0x151434d);
    u32(bytes, 4, imageOffset);
    u16(bytes, 8, vramWidth);
    u16(bytes, 10, vramHeight);
    u16(bytes, 20, 16);
    u16(bytes, 22, 16);
    u16(bytes, imageOffset, 1);
    u16(bytes, imageOffset + 2, 0x801f);
    const image = decodeMcq(bytes);
    expect(image).toMatchObject({ format: 'MCQ', bpp: 4, width: 16, height: 16 });
    expect(Array.from(image.pixels.slice(0, 4))).toEqual([248, 0, 0, 128]);
  });

  it('keeps MCQ page origins in VRAM words when tile traversal crosses a page', () => {
    const imageOffset = 0x2c;
    const vramWidth = 128;
    const bytes = new Uint8Array(imageOffset + vramWidth * 256 * 2);
    u32(bytes, 0, 0x151434d);
    u32(bytes, 4, imageOffset);
    u16(bytes, 8, vramWidth);
    u16(bytes, 10, 256);
    u16(bytes, 12, 96); // Palettes occupy words 96–127, separate from texture pages
    u16(bytes, 20, 272); // 17 columns of 16 tiles: the last column starts page X=64
    u16(bytes, 22, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 64; x++) u16(bytes, imageOffset + (y * vramWidth + x) * 2, 0x1111);
      for (let x = 64; x < 68; x++) u16(bytes, imageOffset + (y * vramWidth + x) * 2, 0x2222);
      u16(bytes, imageOffset + (y * vramWidth + 97) * 2, 0x001f);
      u16(bytes, imageOffset + (y * vramWidth + 113) * 2, 0x001f);
      u16(bytes, imageOffset + (y * vramWidth + 114) * 2, 0x03e0);
    }
    const image = decodeMcq(bytes);
    const pixel = (x: number, y: number) => Array.from(image.pixels.slice((y * image.width + x) * 4, (y * image.width + x + 1) * 4));
    expect(pixel(255, 255)).toEqual([248, 0, 0, 255]);
    expect(pixel(256, 0)).toEqual([0, 248, 0, 255]);
    expect(pixel(271, 255)).toEqual([0, 248, 0, 255]);
  });

  it('rejects malformed assets before allocating an image', () => {
    expect(() => decodeTim(new Uint8Array(8))).toThrow('Invalid TIM magic');
    const malformedMcq = new Uint8Array(0x2c);
    u32(malformedMcq, 0, 0x151434d);
    expect(() => decodeMcq(malformedMcq)).toThrow('MCQ screen dimensions');
  });

  it('uses declared TIM rectangles when a valid retail block includes padding', () => {
    const palette = Array.from({ length: 16 }, (_, index) => index === 1 ? 0x001f : 0);
    const padded = tim(0, 1, [0x11, 0x11, 0, 0], palette);
    u32(padded, 52, 16); // Declares a 16-byte image block although the 1x1 rectangle needs only two bytes
    expect(Array.from(decodeTim(padded).pixels.slice(0, 4))).toEqual([248, 0, 0, 255]);
  });

  it('decodes partial MCQ edge tiles used by small screens', () => {
    const imageOffset = 0x2c;
    const bytes = new Uint8Array(imageOffset + 64 * 16 * 2);
    u32(bytes, 0, 0x151434d);
    u32(bytes, 4, imageOffset);
    u16(bytes, 8, 64);
    u16(bytes, 10, 16);
    u16(bytes, 20, 8);
    u16(bytes, 22, 8);
    u16(bytes, imageOffset, 1);
    u16(bytes, imageOffset + 2, 0x801f);
    expect(decodeMcq(bytes)).toMatchObject({ width: 8, height: 8 });
  });
});
