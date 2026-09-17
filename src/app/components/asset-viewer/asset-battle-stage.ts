import { decodeMcq } from './asset-image';
import { PixelImage, Vec3, SceneOverlay } from './asset-preview-types';

export interface BattleBackdrop {
  mode?: 'flat' | 'submap';
  scene?: { camera: NonNullable<SceneOverlay['camera']>; originX: number; originY: number };
  image: PixelImage;
  offsetX: number;
  offsetY: number;
  above: Vec3;
  below: Vec3;
}

export function decodeBattleBackdrop(bytes: Uint8Array): BattleBackdrop {
  const image = decodeMcq(bytes);
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = header.getUint32(0, true) === 0x0251434d;
  return {
    image,
    offsetX: offset ? header.getInt16(40, true) : 0,
    offsetY: offset ? header.getInt16(42, true) : 0,
    above: [bytes[24], bytes[25], bytes[26]],
    below: [bytes[32], bytes[33], bytes[34]],
  };
}

/** Battle.renderSkybox: PSX angle scrolling at 240 native lines, with MCQ2 offsets. */
export function battleBackdropPlacement(backdrop: BattleBackdrop, cameraFromTarget: Vec3) {
  const [x, y, z] = cameraFromTarget;
  const turn = Math.PI * 2;
  const psx = (angle: number) => {
    const wrapped = angle % turn;
    return Math.trunc((wrapped < 0 ? wrapped + turn : wrapped) * 4096 / turn);
  };
  const width = backdrop.image.width;
  const stride = (Math.floor(1024 / width) + 1) * width;
  const left = Math.trunc(stride * psx(Math.atan2(z, x)) / 4096) % width + backdrop.offsetX;
  const top = 120 + 1888 - psx(Math.atan2(y, Math.hypot(x, z)) + Math.PI) + backdrop.offsetY;
  return { left, top, clear: top >= 0 ? backdrop.above : backdrop.below };
}
