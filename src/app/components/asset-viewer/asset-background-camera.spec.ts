import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { applyBackgroundCamera } from './asset-background-camera';
import { flatBackdrop } from './asset-model-background';
import { projectSubmapPoint } from './asset-submap';
import { BattleBackdrop } from './asset-battle-stage';
import { Vec3 } from './asset-preview-types';

describe('submap model background camera', () => {
  it('projects geometry onto the same scene pixels at wide and narrow viewport ratios', () => {
    for (const aspect of [4 / 3, 2, 0.8]) {
      for (const rotation of [0, 30]) {
        const scene = { camera: { position: [0, 0, -100] as Vec3, target: [0, 0, 0] as Vec3, projectionDistance: 200, rotation }, originX: 140, originY: 110 };
        const backdrop: BattleBackdrop = { ...flatBackdrop({ width: 320, height: 240, pixels: new Uint8ClampedArray() }), mode: 'submap', scene };
        const camera = new PerspectiveCamera(45, aspect);
        applyBackgroundCamera(camera, backdrop);
        const width = 240 * aspect, scale = Math.min(width / 320, 1);
        for (const point of [[0, 0, 0], [10, 15, 50], [-20, -5, 100]] as Vec3[]) {
          const expected = projectSubmapPoint(point, scene.camera, scene)!;
          const projected = new Vector3(point[0], -point[1], -point[2]).project(camera);
          expect((projected.x + 1) * width / 2).toBeCloseTo((width - 320 * scale) / 2 + expected[0] * scale, 4);
          expect((1 - projected.y) * 120).toBeCloseTo((240 - 240 * scale) / 2 + expected[1] * scale, 4);
        }
      }
    }
  });
});
