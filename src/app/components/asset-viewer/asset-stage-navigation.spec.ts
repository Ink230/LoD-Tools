import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { dollyBattleStage } from './asset-stage-navigation';

describe('battle stage navigation', () => {
  it('keeps moving through the original pivot and retains a useful panning distance', () => {
    const position = new Vector3(0, 0, 1000);
    const target = new Vector3();
    let previousTravel = 0;
    for (let i = 0; i < 100; i++) {
      const previous = position.clone();
      dollyBattleStage(position, target, 1000, -100);
      const travel = position.distanceTo(previous);
      expect(position.distanceTo(target)).toBeGreaterThanOrEqual(100 - 1e-8);
      if (i > 50) expect(travel).toBeCloseTo(previousTravel);
      previousTravel = travel;
    }
    expect(position.z).toBeLessThan(0);
    expect(previousTravel).toBeGreaterThan(18);
  });

  it('scales travel with the arena and allows zooming back out', () => {
    const position = new Vector3(0, 0, 1000);
    const target = new Vector3();
    const largerPosition = position.clone().multiplyScalar(10);
    const largerTarget = target.clone();
    dollyBattleStage(position, target, 1000, -100);
    dollyBattleStage(largerPosition, largerTarget, 10000, -100);
    expect(largerPosition.z).toBeCloseTo(position.z * 10);
    dollyBattleStage(position, target, 1000, 100);
    expect(position.z).toBeCloseTo(1000);
    expect(target.toArray()).toEqual([0, 0, 0]);
  });
});
