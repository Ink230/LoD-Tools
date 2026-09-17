import { AssetRecord } from './asset-catalog';
import { BattleBackdrop, decodeBattleBackdrop } from './asset-battle-stage';
import { decodeTim } from './asset-image';
import { decodeEnvironment } from './asset-scene';
import { decodeSubmapComposition, renderSubmapComposition } from './asset-submap';
import { PixelImage } from './asset-preview-types';

export const MODEL_BACKGROUND_FORMATS = ['MCQ', 'PNG', 'TIM', 'Environment'];
export function flatBackdrop(image: PixelImage): BattleBackdrop {
  return { mode: 'flat', image, offsetX: 0, offsetY: 0, above: [0, 0, 0], below: [0, 0, 0] };
}

export async function loadModelBackground(asset: AssetRecord, read: (path: string) => Promise<Uint8Array>) {
  const bytes = await read(asset.path);
  let backdrop: BattleBackdrop;
  let paletteCount = 0;
  const warnings: string[] = [];
  if (asset.format === 'MCQ') backdrop = decodeBattleBackdrop(bytes);
  else if (asset.format === 'TIM') {
    const image = decodeTim(bytes);
    backdrop = flatBackdrop(image);
    paletteCount = image.paletteCount;
  } else if (asset.format === 'PNG') {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    try {
      if (bitmap.width * bitmap.height > 16 * 1024 * 1024) throw new Error('Background exceeds 16 megapixel preview limit');
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      backdrop = flatBackdrop({ width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data });
    } finally { bitmap.close(); }
  } else if (asset.format === 'Environment') {
    const textures: Uint8Array[] = [];
    let total = 0;
    if (!asset.textures?.length) throw new Error('Environment has no linked texture resources');
    if (asset.textures.length > 32) throw new Error('Environment exceeds 32 texture preview limit');
    for (const path of asset.textures) {
      const texture = await read(path);
      total += texture.length;
      if (total > 32 * 1024 * 1024) throw new Error('Environment exceeds 32 MiB texture preview limit');
      textures.push(texture);
    }
    const composition = decodeSubmapComposition(bytes, textures);
    const environment = decodeEnvironment(bytes);
    if (!environment.camera) throw new Error('Environment has no usable camera');
    backdrop = { ...flatBackdrop(renderSubmapComposition(composition, new Set())), mode: 'submap', scene: { camera: environment.camera, originX: composition.originX, originY: composition.originY } };
    warnings.push(...composition.warnings, ...environment.warnings, 'Submap camera and image layers are loaded. Model position starts at the camera target and can be adjusted below. Scripted actor placement and foreground occlusion are not simulated.');
  } else throw new Error('Unsupported model background format');
  return { backdrop, paletteCount, timBytes: asset.format === 'TIM' ? bytes : null, warnings };
}
