import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { decodeLmb } from './asset-animation';
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
  const bytes = new Map<string, Uint8Array>(), parts = new Map<number, ModelPart>();
  const animations = new Map<number, { animation: ModelAnimation; slots: number[] }>();
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
  const resourceFor = (flags: number) => metadata.resources.find(resource => resource.flags === (flags >>> 0));
  const entries = new Map<string, { effect: number; part: number; flags: number; mode: number; mesh: ModelPart }>();
  for (const frame of result.frames) for (const effect of frame.effects) {
    if (effect.kind === 'Empty') continue;
    const root = resourceFor(effect.flags);
    if (!root) { warnings.add(`Missing DEFF resource 0x${effect.flags.toString(16)}`); continue; }
    if (failed.has(effect.flags)) continue;
    if (effect.kind === 'LMB' && !animations.has(effect.flags)) {
      try {
        const payload = (await read(root)).subarray(root.offset);
        animations.set(effect.flags, { animation: decodeLmb(payload, (root.lmbType || 0) as 0 | 1 | 2), slots: lmbPartSlots(payload, root.lmbType || 0) });
        used.set(root.flags, root);
      } catch (error) {
        if (totalBytes > 32 * 1024 * 1024 || bytes.size >= 64) throw error;
        warnings.add(`${root.path}: ${String(error)}`);
        failed.add(effect.flags);
        continue;
      }
    }
    const flags = effect.kind === 'LMB' ? animations.get(effect.flags)!.slots.map(slot => effect.slots[slot]) : [effect.flags];
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
          parts.set(flags[i], part);
          used.set(resource.flags, resource);
        } catch (error) {
          if (totalBytes > 32 * 1024 * 1024 || bytes.size >= 64) throw error;
          warnings.add(`${resource.path}: ${String(error)}`);
          failed.add(flags[i]);
          continue;
        }
      }
      const key = `${effect.id}:${i}:${flags[i]}:${(effect.useEffectTranslucency === false ? -1 : effect.translucency)}`;
      if (!entries.has(key)) {
        if (entries.size >= 256) throw new Error('Effect render-part limit (256) reached');
        const mesh = parts.get(flags[i])!;
        entries.set(key, { effect: effect.id, part: i, flags: flags[i], mode: (effect.useEffectTranslucency === false ? -1 : effect.translucency), mesh: { ...mesh, primitives: mesh.primitives.map(p => (effect.useEffectTranslucency === false ? -1 : effect.translucency) < 0 ? p : { ...p, translucent: true, tpage: ((p.tpage || 0) & ~0x60) | ((effect.useEffectTranslucency === false ? -1 : effect.translucency) << 5) }) } });
      }
    }
  }
  const items = [...entries.values()];
  const model: ModelAsset = { format: 'Effect runtime', parts: items.map(item => item.mesh), warnings: [] };
  const animation: ModelAnimation = { format: 'Effect runtime', fps: 30, warnings: [], frames: result.frames.map(frame => {
    const effects = new Map(frame.effects.map(effect => [effect.id, effect]));
    const world = (effect: PreviewEffect, visited = new Set<number>()): Matrix4 => {
      if (visited.has(effect.id)) throw new Error('Cyclic effect parent hierarchy');
      visited.add(effect.id);
      const local = matrix({ translation: effect.position, rotation: effect.rotation, scale: effect.scale });
      if (effect.parent === -1) return local;
      const parent = effects.get(effect.parent);
      if (!parent) throw new Error(`Effect parent ${effect.parent} is unavailable`);
      return world(parent, visited).multiply(local);
    };
    return items.map(item => {
      const effect = effects.get(item.effect), hidden: PartTransform = { ...identity(), visible: false };
      if (!effect || !effect.visible || (effect.useEffectTranslucency === false ? -1 : effect.translucency) !== item.mode) return hidden;
      let local = identity();
      if (effect.kind === 'LMB') {
        const data = animations.get(effect.flags)!;
        if (effect.slots[data.slots[item.part]] !== item.flags) return hidden;
        local = sample(data.animation, effect.age, item.part, resourceFor(effect.flags)?.lmbType === 2 && !effect.animateRotation);
      }
      const transform = world(effect).multiply(matrix(local));
      const position = new Vector3(), rotation = new Quaternion(), scale = new Vector3();
      transform.decompose(position, rotation, scale);
      const euler = new Euler().setFromQuaternion(rotation, 'ZYX');
      return { translation: position.toArray() as Vec3, rotation: [euler.x, euler.y, euler.z] as Vec3, scale: !effect.applyRotationScale ? local.scale : scale.toArray() as Vec3, screenRotation: !effect.applyRotationScale ? local.rotation : undefined, colour: effect.colour, visible: true };
    });
  }) };
  return { model, animation, resources: [...used.values()], warnings: [...warnings] };
}
