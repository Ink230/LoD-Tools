import { PerspectiveCamera } from 'three';
import { BattleBackdrop } from './asset-battle-stage';

/** Match the submap's PSX projection to the same contained image rectangle as the backdrop. */
export function applyBackgroundCamera(camera: PerspectiveCamera, backdrop: BattleBackdrop): void {
  if (!backdrop.scene) return;
  const { camera: source, originX, originY } = backdrop.scene;
  const height = backdrop.image.height;
  const width = height * camera.aspect;
  const scale = Math.min(width / backdrop.image.width, 1);
  const left = (width - backdrop.image.width * scale) / 2;
  const top = (height - height * scale) / 2;
  camera.position.set(source.position[0], -source.position[1], -source.position[2]);
  camera.up.set(0, 1, 0);
  camera.lookAt(source.target[0], -source.target[1], -source.target[2]);
  camera.rotateZ(-source.rotation * Math.PI / 180);
  camera.near = 0.1;
  camera.far = 1e7;
  camera.fov = 2 * Math.atan(height / (2 * Math.max(1, source.projectionDistance) * scale)) * 180 / Math.PI;
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8] = 1 - 2 * (left + originX * scale) / width;
  camera.projectionMatrix.elements[9] = 2 * (top + originY * scale) / height - 1;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld();
}
