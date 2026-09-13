import { describe, expect, it } from 'vitest';
import { orientPoint } from './world-map-view';

describe('world map view orientation', () => {
  it('puts each selected compass direction at the top', () => {
    const directions = [
      [0, 10],
      [10, 0],
      [0, -10],
      [-10, 0],
    ];
    directions.forEach(([x, z], orientation) => {
      const screen = orientPoint(x, z, orientation);
      expect(screen.x).toBeCloseTo(0);
      expect(screen.z).toBe(-10);
    });
  });

  it('round trips screen positions to unchanged SC coordinates in all views', () => {
    for (let orientation = 0; orientation < 4; orientation++) {
      const screen = orientPoint(137, -291, orientation);
      expect(orientPoint(screen.x, screen.z, orientation)).toEqual({ x: 137, z: -291 });
    }
  });
});
