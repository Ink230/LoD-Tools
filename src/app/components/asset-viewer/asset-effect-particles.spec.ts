import { describe, expect, it } from 'vitest';
import { createSphereParticles, tickSphereParticles } from './asset-effect-particles';

describe('SC sphere particle behaviour', () => {
  it('uses SC radial units, velocity scale, colour and lifetime', () => {
    const data = createSphereParticles(1, 512, 0, 256, 0x48000, () => 0);
    expect(data.instances[0].position).toEqual([0, 512, 0]);
    expect(data.instances[0].velocity).toEqual([0, 64, 0]);
    tickSphereParticles(data);
    expect(data.instances[0]).toMatchObject({ visible: true, position: [0, 576, 0], brightness: 0.75 });
    tickSphereParticles(data); tickSphereParticles(data); tickSphereParticles(data);
    expect(data.instances[0].visible).toBe(false);
  });
  it('applies delayed starts and the spell planar-start flag', () => {
    const data = createSphereParticles(1, 512, 2, 256, 0x48000, bound => bound - 1);
    data.flags = 16;
    tickSphereParticles(data); tickSphereParticles(data);
    expect(data.instances[0].visible).toBe(false);
    tickSphereParticles(data);
    expect(data.instances[0].visible).toBe(true);
    expect(data.instances[0].position[1]).toBe(data.instances[0].velocity[1]);
  });
});
