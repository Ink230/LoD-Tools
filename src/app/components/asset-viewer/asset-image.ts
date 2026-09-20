import { AssetBinary } from './asset-binary';
import type { PixelImage, TextureImage } from './asset-preview-types';

const TIM_MAGIC = 0x10;
const MCQ_MAGIC_1 = 0x151434d;
const MCQ_MAGIC_2 = 0x251434d;
const MAX_PIXELS = 16 * 1024 * 1024;

export type Rgba = [number, number, number, number];

interface TimData {
  bpp: number;
  imageX: number;
  imageY: number;
  imageWidthWords: number;
  imageHeight: number;
  image: Uint8Array;
  clutX: number;
  clutY: number;
  clutWidth: number;
  clutHeight: number;
  clut: Uint8Array | null;
}

function checkedPixels(width: number, height: number) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || width * height > MAX_PIXELS)
    throw new Error(`Asset image dimensions ${width}x${height} exceed the ${MAX_PIXELS.toLocaleString()} pixel limit`);
}

function colour15(value: number, transparentZero = true): Rgba {
  if (value === 0 && transparentZero) return [0, 0, 0, 0];
  // Bit 15 is PSX STP, not an opacity bit. The model renderer can blend it as translucent.
  return [(value & 0x1f) * 8, ((value >>> 5) & 0x1f) * 8, ((value >>> 10) & 0x1f) * 8, value & 0x8000 ? 128 : 255];
}

function parseTim(bytes: Uint8Array): TimData {
  const data = new AssetBinary(bytes);
  if (data.u32(0) !== TIM_MAGIC) throw new Error('Invalid TIM magic');

  const flags = data.u32(4);
  const bpp = flags & 0x7;
  if (bpp > 3) throw new Error(`Unsupported TIM bits per pixel value ${bpp}`);

  let imageBlock = 8;
  let clutX = 0;
  let clutY = 0;
  let clutWidth = 0;
  let clutHeight = 0;
  let clut: Uint8Array | null = null;
  if ((flags & 0x8) !== 0) {
    const clutLength = data.u32(imageBlock);
    if (clutLength < 12) throw new Error('Invalid TIM CLUT block length');
    data.check(imageBlock, clutLength);
    clutX = data.u16(imageBlock + 4);
    clutY = data.u16(imageBlock + 6);
    clutWidth = data.u16(imageBlock + 8);
    clutHeight = data.u16(imageBlock + 10);
    clut = data.slice(imageBlock + 12, clutLength - 12);
    imageBlock += clutLength;
  }

  const imageLength = data.u32(imageBlock);
  if (imageLength < 12) throw new Error('Invalid TIM image block length');
  data.check(imageBlock, imageLength);
  const imageX = data.u16(imageBlock + 4);
  const imageY = data.u16(imageBlock + 6);
  const imageWidthWords = data.u16(imageBlock + 8);
  const imageHeight = data.u16(imageBlock + 10);
  if (imageWidthWords === 0 || imageHeight === 0) throw new Error('TIM image dimensions are empty');

  return { bpp, imageX, imageY, imageWidthWords, imageHeight, image: data.slice(imageBlock + 12, imageLength - 12), clutX, clutY, clutWidth, clutHeight, clut };
}

function outputWidth(tim: TimData) {
  if (tim.bpp === 0) return tim.imageWidthWords * 4;
  if (tim.bpp === 1) return tim.imageWidthWords * 2;
  if (tim.bpp === 2) return tim.imageWidthWords;
  if (tim.imageWidthWords % 3 !== 0) throw new Error('24-bit TIM row width is not divisible into RGB pixels');
  return tim.imageWidthWords * 2 / 3;
}

function u16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | bytes[offset + 1] << 8;
}

function paletteColour(tim: TimData, paletteX: number, paletteY: number, index: number): Rgba {
  if (tim.clut === null || paletteX < tim.clutX || paletteY < tim.clutY) return [0, 0, 0, 0];
  const x = paletteX - tim.clutX + index;
  const y = paletteY - tim.clutY;
  if (x < 0 || x >= tim.clutWidth || y < 0 || y >= tim.clutHeight) return [0, 0, 0, 0];
  const offset = (y * tim.clutWidth + x) * 2;
  return offset + 1 < tim.clut.length ? colour15(u16(tim.clut, offset)) : [0, 0, 0, 0];
}

function imageWord(tim: TimData, x: number, y: number) {
  if (x < tim.imageX || x >= tim.imageX + tim.imageWidthWords || y < tim.imageY || y >= tim.imageY + tim.imageHeight) return null;
  const offset = ((y - tim.imageY) * tim.imageWidthWords + x - tim.imageX) * 2;
  return offset + 1 < tim.image.length ? u16(tim.image, offset) : null;
}

function copy(pixel: Rgba, output: Uint8ClampedArray, offset: number) {
  output[offset] = pixel[0];
  output[offset + 1] = pixel[1];
  output[offset + 2] = pixel[2];
  output[offset + 3] = pixel[3];
}

export function decodeTim(bytes: Uint8Array, paletteIndex = 0, embeddedPaletteRow?: number): TextureImage {
  const tim = parseTim(bytes);
  if (tim.clut === null && embeddedPaletteRow !== undefined) {
    if (tim.bpp !== 0 || tim.imageWidthWords !== 16 || embeddedPaletteRow !== 112 || tim.imageHeight !== 128 || tim.image.length !== 4096) throw new Error('Invalid submap overlay texture layout');
    tim.clut = tim.image.subarray(embeddedPaletteRow * tim.imageWidthWords * 2);
    tim.clutWidth = tim.imageWidthWords;
    tim.clutHeight = tim.imageHeight - embeddedPaletteRow;
    // Palette words occupy the remaining rows; they are not image pixels.
    tim.imageHeight = embeddedPaletteRow;
  }
  if ((tim.bpp === 0 || tim.bpp === 1) && tim.clut === null) throw new Error('Paletted TIM is missing a CLUT');
  const width = outputWidth(tim);
  checkedPixels(width, tim.imageHeight);
  const coloursPerPalette = tim.bpp === 0 ? 16 : tim.bpp === 1 ? 256 : 0;
  const palettesPerRow = coloursPerPalette === 0 ? 0 : Math.floor(tim.clutWidth / coloursPerPalette);
  const paletteCount = palettesPerRow * tim.clutHeight;
  if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= Math.max(paletteCount, 1)) throw new Error(`TIM palette index ${paletteIndex} is out of range`);
  const pixels = new Uint8ClampedArray(width * tim.imageHeight * 4);

  for (let y = 0; y < tim.imageHeight; y++) for (let x = 0; x < width; x++) {
    let pixel: Rgba;
    if (tim.bpp === 0) {
      const word = imageWord(tim, tim.imageX + (x >> 2), tim.imageY + y) ?? 0;
      pixel = paletteColour(tim, tim.clutX + paletteIndex % palettesPerRow * coloursPerPalette, tim.clutY + Math.floor(paletteIndex / palettesPerRow), word >>> (x & 3) * 4 & 0xf);
    } else if (tim.bpp === 1) {
      const word = imageWord(tim, tim.imageX + (x >> 1), tim.imageY + y) ?? 0;
      pixel = paletteColour(tim, tim.clutX + paletteIndex % palettesPerRow * coloursPerPalette, tim.clutY + Math.floor(paletteIndex / palettesPerRow), word >>> (x & 1) * 8 & 0xff);
    } else if (tim.bpp === 2) pixel = colour15(imageWord(tim, tim.imageX + x, tim.imageY + y) ?? 0);
    else {
      const source = y * tim.imageWidthWords * 2 + x * 3;
      pixel = source + 2 < tim.image.length ? [tim.image[source], tim.image[source + 1], tim.image[source + 2], 255] : [0, 0, 0, 0];
    }
    copy(pixel, pixels, (y * width + x) * 4);
  }
  return { format: 'TIM', width, height: tim.imageHeight, pixels, bpp: [4, 8, 16, 24][tim.bpp], imageX: tim.imageX, imageY: tim.imageY, paletteCount, paletteIndex };
}

/** RetailSubmap.prepareMap uploads these overlay TIMs as raw VRAM words.
 * UvAdjustmentMetrics14 places their embedded palettes 112 rows below the image.
 * The paired directories come from RetailSubmap.smapFileIndices_800f982c.
 */
export function decodeAssetTim(bytes: Uint8Array, path: string, paletteIndex = 0): TextureImage {
  const match = /^SECT\/DRGN0\.BIN\/(\d+)\/0$/.exec(path);
  const directory = match ? Number(match[1]) : 0;
  const overlay = directory >= 6675 && directory <= 7609 && directory % 2 === 1;
  return decodeTim(bytes, paletteIndex, overlay ? 112 : undefined);
}

/** Samples a PSX texture page from one TIM uploaded at its own header coordinates. */
export function sampleTim(bytes: Uint8Array, u: number, v: number, clut: number, tpage: number): Rgba {
  const tim = parseTim(bytes);
  if (!Number.isInteger(u) || !Number.isInteger(v)) throw new Error('Texture coordinates must be integers');
  const bpp = tpage >>> 7 & 0x3;
  if (bpp !== tim.bpp) throw new Error(`Texture page bpp ${[4, 8, 16, 24][bpp] ?? bpp} does not match TIM bpp ${[4, 8, 16, 24][tim.bpp]}`);
  const x = (tpage & 0xf) * 64;
  const y = (tpage >>> 4 & 1) * 256;
  const paletteX = (clut & 0x3f) * 16;
  const paletteY = clut >>> 6;
  const textureU = u & 0xff;
  const textureY = y + (v & 0xff);
  if (bpp === 0) {
    const word = imageWord(tim, x + (textureU >> 2), textureY);
    return word === null ? [0, 0, 0, 0] : paletteColour(tim, paletteX, paletteY, word >>> (textureU & 3) * 4 & 0xf);
  }
  if (bpp === 1) {
    const word = imageWord(tim, x + (textureU >> 1), textureY);
    return word === null ? [0, 0, 0, 0] : paletteColour(tim, paletteX, paletteY, word >>> (textureU & 1) * 8 & 0xff);
  }
  if (bpp === 2) {
    const word = imageWord(tim, x + textureU, textureY);
    return word === null ? [0, 0, 0, 0] : colour15(word);
  }
  const byteX = textureU * 3;
  const wordX = x + Math.floor(byteX / 2);
  const word = imageWord(tim, wordX, textureY);
  const next = imageWord(tim, wordX + 1, textureY);
  if (word === null || next === null) return [0, 0, 0, 0];
  const packed = new Uint8Array([word & 0xff, word >>> 8, next & 0xff, next >>> 8]);
  const offset = byteX & 1;
  return [packed[offset], packed[offset + 1], packed[offset + 2], 255];
}

export function texturePage(bytes: Uint8Array, clut: number, tpage: number): PixelImage {
  const width = 256;
  const height = 256;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) copy(sampleTim(bytes, x, y, clut, tpage), pixels, (y * width + x) * 4);
  return { width, height, pixels };
}

/**
 * Renders one PSX texture page after TIMs have been uploaded in order to a shared VRAM.
 * This is needed when a model's image pixels and its CLUT are separate TIM resources.
 */
/** RetailSubmap.loadTextures uses a palette 112 rows below the relocated image.
 * Isolated previews use slot (0, 0); model page/CLUT masks follow UvAdjustmentMetrics14.
 */
export function submapTextureAtOrigin(bytes: Uint8Array): Uint8Array {
  parseTim(bytes);
  const copy = new Uint8Array(bytes);
  const view = new DataView(copy.buffer);
  if (!(view.getUint32(4, true) & 8)) throw new Error('Submap object texture requires a palette');
  const imageBlock = 8 + view.getUint32(8, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 112, true);
  view.setUint16(imageBlock + 4, 0, true);
  view.setUint16(imageBlock + 6, 0, true);
  return copy;
}

export function texturePageFromTims(textures: Uint8Array[], clut: number, tpage: number): PixelImage & { coverage: Uint8Array } {
  if (textures.length === 0) throw new Error('At least one TIM is required to build a texture page');
  if (textures.length > 1024) throw new Error('Too many TIM resources for one texture page');
  const vram = new Uint16Array(1024 * 512);
  const uploaded = new Uint8Array(vram.length);
  for (const bytes of textures) {
    const tim = parseTim(bytes);
    for (let y = 0; y < tim.imageHeight; y++) for (let x = 0; x < tim.imageWidthWords; x++) {
      const targetX = tim.imageX + x;
      const targetY = tim.imageY + y;
      const offset = (y * tim.imageWidthWords + x) * 2;
      if (targetX >= 0 && targetX < 1024 && targetY >= 0 && targetY < 512 && offset + 1 < tim.image.length) {
        vram[targetY * 1024 + targetX] = u16(tim.image, offset);
        uploaded[targetY * 1024 + targetX] = 1;
      }
    }
    if (tim.clut !== null) for (let y = 0; y < tim.clutHeight; y++) for (let x = 0; x < tim.clutWidth; x++) {
      const targetX = tim.clutX + x;
      const targetY = tim.clutY + y;
      const offset = (y * tim.clutWidth + x) * 2;
      if (targetX >= 0 && targetX < 1024 && targetY >= 0 && targetY < 512 && offset + 1 < tim.clut.length) {
        vram[targetY * 1024 + targetX] = u16(tim.clut, offset);
        uploaded[targetY * 1024 + targetX] = 1;
      }
    }
  }
  const bpp = tpage >>> 7 & 0x3;
  if (bpp > 2) throw new Error('24-bit PSX texture pages are not supported');
  const pageX = (tpage & 0xf) * 64;
  const pageY = (tpage >>> 4 & 1) * 256;
  const paletteX = (clut & 0x3f) * 16;
  const paletteY = clut >>> 6;
  const pixels = new Uint8ClampedArray(256 * 256 * 4);
  const coverage = new Uint8Array(256 * 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const wordX = bpp === 0 ? pageX + (x >> 2) : bpp === 1 ? pageX + (x >> 1) : pageX + x;
    const address = (pageY + y) * 1024 + wordX;
    const packed = vram[address];
    let covered = wordX < 1024 && uploaded[address] === 1;
    let pixel: Rgba;
    if (bpp === 0 || bpp === 1) {
      const index = bpp === 0 ? packed >>> (x & 3) * 4 & 0xf : packed >>> (x & 1) * 8 & 0xff;
      pixel = colour15(vram[paletteY * 1024 + paletteX + index]);
      covered = covered && paletteX + index < 1024 && uploaded[paletteY * 1024 + paletteX + index] === 1;
    } else pixel = colour15(packed);
    copy(pixel, pixels, (y * 256 + x) * 4);
    coverage[y * 256 + x] = covered ? 1 : 0;
  }
  return { width: 256, height: 256, pixels, coverage };
}

/** Checks the sampled UV triangles, independently of pixel alpha (zero may be valid transparency). */
export function textureCoversPrimitive(coverage: Uint8Array, uvs: [number, number][]): boolean {
  if (uvs.some(([u, v]) => coverage[(v & 255) * 256 + (u & 255)] !== 1)) return false;
  const triangles = uvs.length === 4 ? [[0, 1, 2], [1, 2, 3]] : [[0, 1, 2]];
  for (const indices of triangles) {
    const points = indices.map(index => uvs[index]);
    if (points.some(point => !point)) return false;
    const [a, b, c] = points;
    const edge = (p: number[], q: number[], x: number, y: number) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
    if (edge(a, b, c[0], c[1]) === 0) continue;
    for (let y = Math.min(a[1], b[1], c[1]); y <= Math.max(a[1], b[1], c[1]); y++) {
      for (let x = Math.min(a[0], b[0], c[0]); x <= Math.max(a[0], b[0], c[0]); x++) {
        const edges = [edge(a, b, x, y), edge(b, c, x, y), edge(c, a, x, y)];
        if ((edges.every(value => value >= 0) || edges.every(value => value <= 0)) && coverage[(y & 255) * 256 + (x & 255)] !== 1) return false;
      }
    }
  }
  return true;
}

export function decodeMcq(bytes: Uint8Array): TextureImage {
  const data = new AssetBinary(bytes);
  const magic = data.u32(0);
  if (magic !== MCQ_MAGIC_1 && magic !== MCQ_MAGIC_2) throw new Error('Invalid MCQ magic');
  const imageOffset = data.u32(4);
  const vramWidth = data.u16(8);
  const vramHeight = data.u16(10);
  const clutX = data.u16(12);
  const clutY = data.u16(14);
  const initialU = data.u16(16);
  const initialV = data.u16(18);
  const width = data.u16(20);
  const height = data.u16(22);
  if (width === 0 || height === 0) throw new Error('MCQ screen dimensions must be non-zero');
  checkedPixels(width, height);
  const expectedImageBytes = vramWidth * vramHeight * 2;
  data.check(imageOffset, 0);
  // Retail MCQs can end a few words short of their declared VRAM rectangle. SC's uploadData15
  // consumes the bytes that exist, leaving the missing VRAM words untouched.
  const imageBytes = Math.min(expectedImageBytes, bytes.length - imageOffset);
  if (imageBytes === 0 || imageBytes % 2 !== 0) throw new Error('MCQ image data is empty or not 16-bit aligned');
  const vram = data.slice(imageOffset, imageBytes);
  const word = (x: number, y: number) => {
    const offset = (y * vramWidth + x) * 2;
    return x >= 0 && x < vramWidth && y >= 0 && y < vramHeight && offset + 1 < vram.length ? u16(vram, offset) : null;
  };
  const pixels = new Uint8ClampedArray(width * height * 4);
  let u = initialU * 4 & 0xfc;
  let v = initialV;
  let tpageX = initialU & 0x3c0;
  const tpageY = initialV & 0x100;
  let paletteX = clutX;
  let paletteY = clutY;

  // This is McqBuilder's chunk traversal: columns first, then rows, with a CLUT row per tile.
  for (let chunkX = 0; chunkX < width; chunkX += 16) for (let chunkY = 0; chunkY < height; chunkY += 16) {
    for (let py = 0; py < Math.min(16, height - chunkY); py++) for (let px = 0; px < Math.min(16, width - chunkX); px++) {
      const textureU = (u + px) & 0xff;
      const textureY = tpageY + ((v + py) & 0xff);
      // McqBuilder's texture-page X is already in VRAM words; only U is in pixels.
      const packed = word(tpageX + (textureU >> 2), textureY);
      const index = packed === null ? 0 : packed >>> (textureU & 3) * 4 & 0xf;
      const colour = word(paletteX + index, paletteY) ?? 0;
      // MCQs are full-screen backgrounds, so palette zero is opaque black rather than a sprite hole.
      copy(colour15(colour, false), pixels, ((chunkY + py) * width + chunkX + px) * 4);
    }
    v = v + 16 & 0xf0;
    if (v === 0) {
      u = u + 16 & 0xfc;
      if (u === 0) tpageX += 64;
    }
    paletteY = paletteY + 1 & 0xff;
    if (paletteY === 0) paletteX += 16;
    paletteY |= tpageY;
  }
  return { format: 'MCQ', width, height, pixels, bpp: 4, imageX: 0, imageY: 0, paletteCount: width / 16 * height / 16, paletteIndex: 0 };
}
