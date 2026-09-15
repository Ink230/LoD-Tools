import { AssetBinary } from './asset-binary';
import { decodeTim } from './asset-image';
import { PixelImage, TextureImage, SceneOverlay, Vec3 } from './asset-preview-types';

export interface SubmapLayer { name: string; foreground: boolean; x: number; y: number; image: PixelImage; }
export interface SubmapComposition { width: number; height: number; originX: number; originY: number; layers: SubmapLayer[]; warnings: string[]; }

/** RetailSubmap.prepareEnv: resolve TIM by page origin, crop UV rectangle, place at screen offset. */
export function decodeSubmapComposition(bytes: Uint8Array, textures: Uint8Array[]): SubmapComposition {
  const data = new AssetBinary(bytes);
  const count = data.u8(20), backgrounds = data.u8(21);
  data.check(24, count * 36);
  const warnings: string[] = [];
  const images: TextureImage[] = [];
  for (const texture of textures) {
    try { images.push(decodeTim(texture)); } catch (error) { warnings.push(String(error)); }
  }
  const records = Array.from({ length: count }, (_, index) => {
    const offset = 24 + index * 36;
    return { index, u: data.u16(offset + 8), v: data.u16(offset + 10), width: data.u16(offset + 12), height: data.u16(offset + 14), x: data.i16(offset + 16), y: data.i16(offset + 18), tpage: data.u16(offset + 32) };
  });
  if (!records.length) throw new Error('Environment contains no image layers');
  const left = Math.min(...records.map(r => r.x)), top = Math.min(...records.map(r => r.y));
  const width = Math.max(...records.map(r => r.x + r.width)) - left;
  const height = Math.max(...records.map(r => r.y + r.height)) - top;
  if (width <= 0 || height <= 0 || width * height > 16 * 1024 * 1024) throw new Error('Submap composition exceeds the 16 megapixel preview limit');
  const layers: SubmapLayer[] = [];
  for (const r of records) {
    const pageX = (r.tpage & 15) * 64, pageY = (r.tpage & 16) ? 256 : 0;
    const texture = images.find(image => pageX >= image.imageX && pageX < image.imageX + image.width * image.bpp / 16 && pageY >= image.imageY && pageY < image.imageY + image.height);
    if (!texture) { warnings.push(`Layer ${r.index}: no TIM covers texture page (${pageX}, ${pageY})`); continue; }
    const w = Math.max(0, Math.min(r.width, texture.width - r.u)), h = Math.max(0, Math.min(r.height, texture.height - r.v));
    const pixels = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const source = ((r.v + y) * texture.width + r.u + x) * 4, target = (y * w + x) * 4;
      pixels.set(texture.pixels.subarray(source, source + 4), target);
      // SC makes nonzero palette colors opaque for both background and cutouts.
      if (pixels[target + 3]) pixels[target + 3] = 255;
    }
    layers.push({ name: `${r.index < backgrounds ? 'Background' : 'Foreground'} ${r.index}`, foreground: r.index >= backgrounds, x: r.x - left, y: r.y - top, image: { width: w, height: h, pixels } });
  }
  const backgroundsOnly = records.filter(r => r.index < backgrounds && data.i16(24 + r.index * 36 + 6) === 0x4e);
  const bounds = backgroundsOnly.length ? backgroundsOnly : records;
  const backgroundWidth = Math.max(...bounds.map(r => r.x + r.width)) - Math.min(...bounds.map(r => r.x));
  const backgroundHeight = Math.max(...bounds.map(r => r.y + r.height)) - Math.min(...bounds.map(r => r.y));
  return { width, height, originX: Math.trunc(backgroundWidth / 2) - left, originY: Math.trunc(backgroundHeight / 2) - top, layers, warnings };
}

export function renderSubmapComposition(scene: SubmapComposition, hidden: Set<number>): PixelImage {
  const pixels = new Uint8ClampedArray(scene.width * scene.height * 4);
  scene.layers.forEach((layer, index) => {
    if (hidden.has(index)) return;
    for (let y = 0; y < layer.image.height; y++) for (let x = 0; x < layer.image.width; x++) {
      const source = (y * layer.image.width + x) * 4;
      if (!layer.image.pixels[source + 3]) continue;
      pixels.set(layer.image.pixels.subarray(source, source + 4), ((layer.y + y) * scene.width + layer.x + x) * 4);
    }
  });
  return { width: scene.width, height: scene.height, pixels };
}

/** Graphics.GsSetSmapRefView2L, in PSX screen coordinates (positive Y down). */
export function projectSubmapPoint(point: Vec3, camera: NonNullable<SceneOverlay['camera']>, scene: Pick<SubmapComposition, 'originX' | 'originY'>): [number, number] | null {
  const [dx, dy, dz] = camera.target.map((value, index) => value - camera.position[index]);
  const length = Math.trunc(Math.hypot(dx, dy, dz));
  if (!length) return null;
  const horizontal = Math.trunc(Math.hypot(dx, dz));
  const fixed = (value: number, divisor: number) => Math.trunc(value * 4096 / divisor) / 4096;
  const sy = fixed(dy, length), cy = fixed(horizontal, length);
  const sx = horizontal ? fixed(dx, horizontal) : 0, cx = horizontal ? fixed(dz, horizontal) : 1;
  const [x, y, z] = point.map((value, index) => value - camera.position[index]);
  const yawX = cx * x - sx * z, yawZ = sx * x + cx * z;
  const pitchY = cy * y - sy * yawZ, depth = sy * y + cy * yawZ;
  if (depth <= 0) return null;
  const angle = camera.rotation * Math.PI / 180;
  const screenX = Math.cos(angle) * yawX + Math.sin(angle) * pitchY;
  const screenY = -Math.sin(angle) * yawX + Math.cos(angle) * pitchY;
  return [scene.originX + camera.projectionDistance * screenX / depth, scene.originY + camera.projectionDistance * screenY / depth];
}