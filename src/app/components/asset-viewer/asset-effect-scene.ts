import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { decodeAnimation, decodeLmb, Lmb2Playback } from './asset-animation';
import { AssetBinary } from './asset-binary';
import { EffectResource, EffectRuntimeMetadata, EffectRuntimeResult, PreviewEffect } from './asset-effect-runtime';
import { lmbPartSlots } from './asset-lmb-composition';
import { decodeModel } from './asset-model';
import { ModelAnimation, ModelAsset, ModelPart, PartTransform, Vec3 } from './asset-preview-types';

const identity = (): PartTransform => ({ translation: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
const matrix = (transform: PartTransform) => new Matrix4().compose(new Vector3(...transform.translation), new Quaternion().setFromEuler(new Euler(...transform.rotation, 'ZYX')), new Vector3(...transform.scale));
function sample(animation: ModelAnimation, age: number, index: number, fixedRotation = false): PartTransform {
  const tick = Math.max(0, age) / 2, lo = Math.floor(tick) % animation.frames.length;
  const a = animation.frames[lo][index], b = animation.frames[(lo + 1) % animation.frames.length][index], amount = tick % 1;
  return { translation: a.translation.map((value, i) => value + (b.translation[i] - value) * amount) as Vec3,
    scale: a.scale.map((value, i) => value + (b.scale[i] - value) * amount) as Vec3, rotation: fixedRotation ? animation.frames[0][index].rotation : a.rotation };
}
function spritePart(bytes: Uint8Array, offset: number): ModelPart {
  const data = new AssetBinary(bytes), u = data.u16(offset), v = data.u16(offset + 2);
  const w = (data.u16(offset + 4) * 4) & 255, h = data.u16(offset + 6) & 255;
  const x = (u & 63) * 4, y = v & 255;
  return { billboard: true, vertices: [[-w, h, 0], [w, h, 0], [-w, -h, 0], [w, -h, 0]], normals: [], primitives: [{ indices: [0, 1, 2, 3], colors: [[128, 128, 128]],
    uvs: [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]],
    clut: (data.u16(offset + 10) << 6) | ((data.u16(offset + 8) & 0x3f0) >>> 4), tpage: ((u & 0x3c0) >>> 6) | ((v & 0x100) >>> 4), translucent: true }] };
}

/** Converts VM frames into the viewer's existing model/animation representation. */
export async function buildEffectScene(result: EffectRuntimeResult, metadata: EffectRuntimeMetadata, readFile: (path: string) => Promise<Uint8Array>) {
  const bytes = new Map<string, Uint8Array>(), parts = new Map<number, ModelPart[]>();
  const animations = new Map<number, { animation: ModelAnimation; slots: number[] }>();
  const lmb2Bytes = new Map<number, Uint8Array>();
  const warnings = new Set(result.diagnostics), used = new Map<number, EffectResource>();
  let totalBytes = 0;
  const failed = new Set<number>();
  const read = async (resource: EffectResource) => {
    if (!bytes.has(resource.path)) {
      if (bytes.size >= 64) throw new Error('Effect resource count exceeds 64 files');
      const data = await readFile(resource.path);
      totalBytes += data.length;
      if (totalBytes > 32 * 1024 * 1024) throw new Error('Effect resource data exceeds 32 MiB');
      bytes.set(resource.path, data);
    }
    return bytes.get(resource.path)!;
  };
  const globals: EffectResource[] = [
    { path: 'SECT/DRGN0.BIN/4114/2/17', flags: 0x40fff03, offset: 20, kind: 'Sprite' },
    { path: 'SECT/DRGN0.BIN/4114/2/34', flags: 0x40fff26, offset: 20, kind: 'Sprite' },
  ];
  const resourceFor = (flags: number) => [...metadata.resources, ...globals].find(resource => resource.flags === (flags >>> 0));
  const entries = new Map<string, { effect: number; part: number; trail: number; flags: number; mode: number; mesh: ModelPart }>();
  for (const frame of result.frames) for (const effect of frame.effects) {
    if (effect.kind === 'Empty') continue;
    const root = resourceFor(effect.flags);
    if (!root) { warnings.add(`Missing DEFF resource 0x${effect.flags.toString(16)}`); continue; }
    if (failed.has(effect.flags)) continue;
    if (effect.kind === 'LMB' && !animations.has(effect.flags)) {
      try {
        const payload = (await read(root)).subarray(root.offset);
        if (root.lmbType === 2) lmb2Bytes.set(root.flags, payload);
        animations.set(effect.flags, { animation: decodeLmb(payload, (root.lmbType || 0) as 0 | 1 | 2), slots: lmbPartSlots(payload, root.lmbType || 0) });
        used.set(root.flags, root);
      } catch (error) {
        if (totalBytes > 32 * 1024 * 1024 || bytes.size >= 64) throw error;
        warnings.add(`${root.path}: ${String(error)}`);
        failed.add(effect.flags);
        continue;
      }
    }
    if (effect.kind === 'Animated' && !animations.has(effect.flags)) {
      const payload = await read(root), binary = new AssetBinary(payload);
      const animationBytes = payload.subarray(binary.u32(20));
      const animation = new AssetBinary(animationBytes).u32(0) === 0x424d4c ? decodeLmb(animationBytes, 0) : decodeAnimation(animationBytes);
      parts.set(effect.flags, decodeModel(payload.subarray(root.offset)).parts);
      animations.set(effect.flags, { animation, slots: [] });
      used.set(root.flags, root);
    }
    const flags = effect.kind === 'LMB' ? animations.get(effect.flags)!.slots.map(slot => effect.slots[slot])
      : Array(effect.particles?.instances.length || (effect.kind === 'Animated' ? parts.get(effect.flags)!.length : 1)).fill(effect.flags) as number[];
    for (let i = 0; i < flags.length; i++) {
      if (!flags[i]) continue;
      const resource = resourceFor(flags[i]);
      if (!resource || resource.kind === 'LMB') { warnings.add(`Unsupported child/global effect binding 0x${flags[i].toString(16)}`); continue; }
      if (failed.has(flags[i])) continue;
      if (!parts.has(flags[i])) {
        try {
          const payload = await read(resource);
          const part = resource.kind === 'Sprite' ? spritePart(payload, resource.offset) : decodeModel(payload.subarray(resource.offset)).parts[0];
          if (!part) throw new Error('Resource has no model parts');
          parts.set(flags[i], [part]);
          used.set(resource.flags, resource);
        } catch (error) {
          if (totalBytes > 32 * 1024 * 1024 || bytes.size >= 64) throw error;
          warnings.add(`${resource.path}: ${String(error)}`);
          failed.add(flags[i]);
          continue;
        }
      }
      const copies = effect.trail ? 1 + Math.max(0, effect.trail.copies - 1) * (effect.trail.steps + 1) : 1;
      for (let trail = 0; trail < copies; trail++) {
        const mode = effect.useEffectTranslucency === false ? -1 : effect.translucency;
        const key = `${effect.id}:${i}:${flags[i]}:${mode}:${trail}`;
        if (entries.has(key)) continue;
        if (entries.size >= 1024) throw new Error('Effect render-part limit (1024) reached');
        const mesh = parts.get(flags[i])![effect.kind === 'Animated' ? i : 0];
        entries.set(key, { effect: effect.id, part: i, trail, flags: flags[i], mode, mesh: { ...mesh, primitives: mesh.primitives.map(p => mode < 0 ? p : { ...p, translucent: true, tpage: ((p.tpage || 0) & ~0x60) | (mode << 5) }) } });
      }
    }
  }
  const items = [...entries.values()];
  const model: ModelAsset = { format: 'Effect runtime', parts: items.map(item => item.mesh), warnings: [] };
  const samplers = new Map<number, Lmb2Playback>(), scratch = Array(0x300).fill(0) as number[];
  const history = new Map<number, Vector3[]>();
  const animation: ModelAnimation = { format: 'Effect runtime', fps: 30, warnings: [], frames: result.frames.map(frame => {
    const effects = new Map(frame.effects.map(effect => [effect.id, effect]));
    const sampled = new Map<number, PartTransform[]>();
    for (const effect of frame.effects) {
      const data = lmb2Bytes.get(effect.flags);
      if (effect.kind === 'LMB' && data) {
        if (!samplers.has(effect.id)) samplers.set(effect.id, new Lmb2Playback(data));
        sampled.set(effect.id, samplers.get(effect.id)!.sample(effect.age, !!effect.animateRotation, scratch));
      }
    }
    const world = (effect: PreviewEffect, visited = new Set<number>()): Matrix4 => {
      if (visited.has(effect.id)) throw new Error('Cyclic effect parent hierarchy');
      visited.add(effect.id);
      const local = matrix({ translation: effect.position, rotation: effect.rotation, scale: effect.scale });
      if (effect.parent === -1) return local;
      const parent = effects.get(effect.parent);
      if (!parent) throw new Error(`Effect parent ${effect.parent} is unavailable`);
      const parentWorld = world(parent, visited);
      if ((effect.parentPart ?? -1) >= 0 && parent.kind === 'Animated') {
        const data = animations.get(parent.flags)!;
        parentWorld.multiply(matrix(sample(data.animation, parent.age, effect.parentPart!)));
      }
      return parentWorld.multiply(local);
    };
    for (const effect of frame.effects) if (effect.trail) {
      const positions = history.get(effect.id) || [];
      // A trail may outlive its attached model by a tick; retain its last pose.
      if (effect.parent !== -1 && !effects.has(effect.parent)) continue;
      positions.unshift(new Vector3().setFromMatrixPosition(world(effect)));
      positions.length = Math.min(positions.length, effect.trail.copies + 1);
      history.set(effect.id, positions);
    }
    return items.map(item => {
      const effect = effects.get(item.effect), hidden: PartTransform = { ...identity(), visible: false };
      if (!effect || !effect.visible || (effect.useEffectTranslucency === false ? -1 : effect.translucency) !== item.mode) return hidden;
      if (effect.parent !== -1 && !effects.has(effect.parent)) return hidden;
      let local = identity();
      let colour = effect.colour;
      if (effect.kind === 'LMB') {
        const data = animations.get(effect.flags)!;
        if (effect.slots[data.slots[item.part]] !== item.flags) return hidden;
        local = sampled.get(effect.id)?.[item.part] || sample(data.animation, effect.age, item.part);
      }
      if (effect.kind === 'Animated') local = sample(animations.get(effect.flags)!.animation, effect.age, item.part);
      if (effect.particles) {
        const particle = effect.particles.instances[item.part];
        if (!particle?.visible) return hidden;
        local = { ...identity(), translation: particle.position, rotation: particle.rotation };
        colour = effect.colour.map(value => value * particle.brightness) as Vec3;
      }
      // Particle positions are rotated/translated, not multiplied by the
      // manager's mesh scale (SEffe.FUN_800cf7d4 / TmdParticle).
      const transform = effect.particles
        ? matrix({ translation: effect.position, rotation: effect.rotation, scale: [1, 1, 1] }).multiply(matrix({ ...local, scale: effect.scale }))
        : world(effect).multiply(matrix(local));
      const position = new Vector3(), rotation = new Quaternion(), scale = new Vector3();
      transform.decompose(position, rotation, scale);
      // QuadParticle uses 0x5000/z screen scaling; with SC's 320 projection
      // distance this is 32 times our billboard's two-world-units-per-pixel quad.
      if (effect.particles && effect.kind === 'Sprite') scale.multiplyScalar(32);
      if (item.trail && effect.trail) {
        const positions = history.get(effect.id)!;
        const lag = item.trail / (effect.trail.steps + 1), lo = Math.floor(lag), hi = Math.ceil(lag);
        if (!positions[hi]) return hidden;
        position.copy(positions[lo]).lerp(positions[hi], lag - lo);
        const multiplier = 1 + (effect.trail.modifier / 4096 - 1) * item.trail / ((effect.trail.copies - 1) * (effect.trail.steps + 1));
        if (effect.trail.flags & 4) colour = colour.map(value => value * multiplier) as Vec3;
        if (effect.trail.flags & 8) scale.multiplyScalar(multiplier);
      }
      const euler = new Euler().setFromQuaternion(rotation, 'ZYX');
      return { translation: position.toArray() as Vec3, rotation: [euler.x, euler.y, euler.z] as Vec3, scale: !effect.applyRotationScale ? local.scale : scale.toArray() as Vec3, screenRotation: !effect.applyRotationScale ? local.rotation : undefined, colour, visible: true };
    });
  }) };
  animation.cameras = result.frames.map(frame => frame.camera);
  animation.flashes = result.frames.map(frame => frame.flash);
  return { model, animation, resources: [...used.values()], warnings: [...warnings] };
}
