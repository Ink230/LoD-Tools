import { Vec3 } from './asset-preview-types';

export interface EffectParticle {
  position: Vec3; velocity: Vec3; rotation: Vec3; rotationStep: Vec3;
  delay: number; remaining: number; life: number; visible: boolean; brightness: number;
}
export interface EffectParticles {
  inner: number; flags: number; gravity: number; floor: number; size: number;
  instances: EffectParticle[];
}

/** SC Instance46/Instance21: sphere positions and radial velocities, with the
 * generic particle delay, fade and motion rules. Other behaviours are rejected. */
export function createSphereParticles(count: number, radius: number, delay: number, speed: number, inner: number, random: (bound: number) => number): EffectParticles {
  if (count < 1 || count > 256 || delay < 0 || delay > 600) throw new Error('Particle preview limit exceeded');
  if (!(inner & 0xff00)) inner |= 127 << 8;
  if (!(inner & 0xff0000)) inner |= 32 << 16;
  const sin = (angle: number) => Math.trunc(Math.sin(angle * Math.PI / 2048) * 4096);
  const cos = (angle: number) => Math.trunc(Math.cos(angle * Math.PI / 2048) * 4096);
  return { inner, flags: 0, gravity: 0, floor: 0, size: 0, instances: Array.from({ length: count }, () => {
    const a = random(4097), b = random(2049), life = inner >>> 16 & 255;
    const direction: Vec3 = [(cos(a) * sin(b)) >> 12, cos(b), (sin(a) * sin(b)) >> 12];
    return { position: direction.map(value => (value * radius) >> 12) as Vec3,
      velocity: direction.map(value => (value >> 6) * speed / 256) as Vec3,
      rotation: [0, 0, 0].map(() => random(4096) * Math.PI / 2048) as Vec3,
      rotationStep: [0, 0, 0].map(() => (random(512) - 256) * Math.PI / 2048) as Vec3,
      delay: random(delay + 1) + 1, remaining: life, life, visible: false, brightness: 1 };
  }) };
}

export function tickSphereParticles(data: EffectParticles): void {
  for (const particle of data.instances) {
    if (--particle.delay > 0) continue;
    if (particle.delay === 0) {
      if (data.flags & 16) particle.position[1] = 0;
      if (data.flags & 64) particle.velocity[1] = 0;
    }
    if (particle.remaining > 0) particle.remaining--;
    particle.visible = particle.remaining > 0 || !!(data.flags & 128);
    if (!particle.visible) continue;
    particle.brightness = (data.flags & 1) || (data.inner & 8) ? 1 : (data.inner >>> 8 & 255) / 128 * Math.max(0, particle.remaining / particle.life);
    particle.position = particle.position.map((value, i) => value + particle.velocity[i]) as Vec3;
    particle.velocity[1] += data.gravity / 256;
    if (data.inner & 4) particle.rotation = particle.rotation.map((value, i) => value + particle.rotationStep[i]) as Vec3;
  }
}
