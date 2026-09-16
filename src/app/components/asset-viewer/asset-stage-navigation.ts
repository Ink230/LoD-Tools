import { Vector3 } from 'three';

/** Keep an arena-scale orbit pivot ahead of the camera so dollying can cross the arena. */
export function dollyBattleStage(position: Vector3, target: Vector3, extent: number, delta: number): void {
  const direction = target.clone().sub(position);
  const distance = direction.length();
  if (!distance || !Number.isFinite(delta)) return;
  direction.divideScalar(distance);
  const minimumDistance = Math.max(1, extent * 0.1);
  const travel = Math.max(distance, minimumDistance) * (1 - Math.exp(Math.max(-500, Math.min(500, delta)) * 0.002));
  position.addScaledVector(direction, travel);
  // OrbitControls scales panning by pivot distance. Never let that distance collapse.
  target.addScaledVector(direction, Math.max(0, minimumDistance - (distance - travel)));
}
