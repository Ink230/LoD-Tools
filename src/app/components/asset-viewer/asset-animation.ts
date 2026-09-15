import { AssetBinary } from './asset-binary';
import { ModelAnimation, PaletteAnimation, PartTransform, SpriteAnimation, SpritePiece, Vec3 } from './asset-preview-types';

/** PSX angles use 4096 units per turn. SC keeps model transforms in radians. */
const PSX_ANGLE_TO_RADIAN = (Math.PI * 2) / 4096;
const PREVIEW_FPS = 30;
const MAX_PARTS = 4096;
const MAX_FRAMES = 65536;
const MAX_TRANSFORMS = 262144;
const CMB_MAGIC = 0x2042_4d43;
const LMB_MAGIC = 0x0042_4d4c;

export type LmbType = 0 | 1 | 2;

export interface ClutAnimationStep {
  sourceYOffset: number;
  durationTicks: number;
}

/** VRAM row-copy instructions needed to apply a CContainer CLUT animation. */
export interface DecodedClutAnimation {
  targetClutIndex: number;
  fps: number;
  steps: ClutAnimationStep[];
  warnings: string[];
}

interface LmbTransform {
  scale: [number, number, number];
  translation: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Decodes a standard TMD animation or CMB. LMB has no type discriminator in
 * its header, so callers must use decodeLmb with the DEFF part's type.
 */
export function decodeAnimation(bytes: Uint8Array): ModelAnimation {
  const binary = new AssetBinary(bytes);
  if (binary.bytes.length < 4) throw new Error('Truncated animation header');

  const magic = binary.u32(0);
  if (magic === CMB_MAGIC) return decodeCmb(binary);
  if (magic === LMB_MAGIC) throw new Error('LMB subtype is not stored in its header; call decodeLmb(bytes, 0, 1, or 2) using the DEFF part type');
  return decodeStandard(binary);
}

/** Decodes an LMB after its containing DEFF part identifies its subtype. */
export function decodeLmb(bytes: Uint8Array, type: LmbType): ModelAnimation {
  const binary = new AssetBinary(bytes);
  if (binary.u32(0) !== LMB_MAGIC) throw new Error('Not an LMB animation');

  return type === 0 ? decodeLmb0(binary) : type === 1 ? decodeLmb1(binary) : decodeLmb2(binary);
}

/**
 * Decodes SC's ANM sequence and sprite-group table. flag_06 is kept intact as
 * the source tpage/flag word; SC's save-point renderer consumes UV and CBA.
 */
export function decodeAnm(bytes: Uint8Array): SpriteAnimation {
  const binary = new AssetBinary(bytes);
  binary.check(0, 8);
  const groupCount = count(binary.u16(4), 'ANM sprite group');
  const sequenceCount = count(binary.u16(6), 'ANM sequence');
  binary.check(8, sequenceCount * 8 + groupCount * 4);
  const groupOffsets = Array.from({ length: groupCount }, (_, index) => binary.u32(8 + sequenceCount * 8 + index * 4));
  const groups = groupOffsets.map((offset) => readAnmGroup(binary, offset));
  const frames = Array.from({ length: sequenceCount }, (_, index) => {
    const offset = 8 + index * 8;
    const groupIndex = binary.u16(offset);
    if (groupIndex >= groups.length) throw new Error(`ANM sequence ${index} refers to missing sprite group ${groupIndex}`);
    // SMap enters subsequent sequences with time_02 - 1 and decrements before
    // the next render, so their steady-state duration is exactly time_02.
    const duration = Math.max(1, binary.u8(offset + 2));
    return {
      duration,
      pieces: groups[groupIndex],
    };
  });

  return {
    format: 'ANM',
    fps: PREVIEW_FPS,
    frames,
    warnings: ['ANM duration is max(1, sequence time), matching SMap steady-state playback at its 30 Hz game tick; the initial sequence can display for one additional tick during setup', 'ANM pieces use SMap save-point placement: x is -width / 2 and y is 0. Sequence x/y and metric offset/x/y fields are not consumed by SC’s current ANM renderer', 'ANM flag_06 is exposed unchanged as tpage. SC currently renders save-point ANM using UV, CBA, width, and height only; flag2 is not decoded as flip state'],
  };
}

/**
 * Reads one CLUT animation stream. A direct ClutAnimation begins at offset 0;
 * pass container: true when bytes begin with CContainer's four CLUT offsets.
 * Each returned frame is [sourceYOffset, durationTicks], not palette pixels.
 */
export function decodeClutAnimation(bytes: Uint8Array, options: { container?: boolean; index?: number } = {}): PaletteAnimation {
  const animation = decodeClutAnimationDetails(bytes, options);
  return { frames: animation.steps.map(({ sourceYOffset, durationTicks }) => [sourceYOffset, durationTicks]), fps: animation.fps, warnings: animation.warnings };
}

/**
 * Returns the target and source rows needed to apply a CLUT animation to a
 * decoded TIM palette. The copy is from clutY + sourceYOffset to
 * clutY + targetClutIndex, exactly as SC's Models.animateModelClut does.
 */
export function decodeClutAnimationDetails(bytes: Uint8Array, options: { container?: boolean; index?: number } = {}): DecodedClutAnimation {
  const binary = new AssetBinary(bytes);
  const container = options.container ?? looksLikeClutContainer(binary);
  const index = options.index ?? (container ? firstClutAnimationIndex(binary) : 0);
  if (!Number.isInteger(index) || index < 0 || index > 3) throw new Error('CLUT animation index must be from 0 through 3');
  if (!container && index !== 0) throw new Error('A direct CLUT animation only has index 0');
  const offset = container ? binary.u32(index * 4) : 0;
  if (offset === 0xffff_ffff) throw new Error(`CContainer CLUT animation ${index} is absent`);
  binary.check(offset, 4);
  const targetClutIndex = binary.i16(offset + 2);
  const steps: ClutAnimationStep[] = [];
  let cursor = offset + 4;
  let hasTrailingSource = false;
  while (true) {
    const sourceYOffset = binary.i16(cursor);
    if (sourceYOffset === -1) break;
    const duration = binary.i16(cursor + 2);
    if (duration === -1) {
      hasTrailingSource = true;
      break;
    }
    steps.push({ sourceYOffset, durationTicks: duration });
    if (steps.length > MAX_FRAMES) throw new Error('CLUT animation exceeds preview frame limit');
    cursor += 4;
  }

  return {
    targetClutIndex,
    fps: PREVIEW_FPS,
    steps,
    warnings: [`CLUT target index ${targetClutIndex}; frames are [sourceYOffset, durationTicks] palette-copy instructions, not decoded palette colours`, hasTrailingSource ? 'The stream ends with an unpaired source row followed by -1. SC accepts this raw stream; it is not a timed preview step' : 'The stream ends with signed short -1, matching Models.animateModelClut'],
  };
}

function looksLikeClutContainer(binary: AssetBinary): boolean {
  if (binary.bytes.length < 16) return false;
  let activeCount = 0;
  for (let index = 0; index < 4; index++) {
    const offset = binary.u32(index * 4);
    if (offset === 0xffff_ffff) continue;
    if (offset < 16 || offset > binary.bytes.length - 4) return false;
    activeCount++;
  }
  return activeCount > 0;
}

function firstClutAnimationIndex(binary: AssetBinary): number {
  for (let index = 0; index < 4; index++) {
    if (binary.u32(index * 4) !== 0xffff_ffff) return index;
  }
  throw new Error('CContainer has no CLUT animations');
}

function decodeStandard(binary: AssetBinary): ModelAnimation {
  binary.check(0, 16);
  const parts = count(binary.u16(12), 'model part');
  const totalEngineFrames = binary.i16(14);
  if (totalEngineFrames < 0 || totalEngineFrames % 2 !== 0) throw new Error(`Invalid standard animation engine-frame count ${totalEngineFrames}`);
  const frames = totalEngineFrames / 2;
  ensureTransformCount(frames, parts);
  const result = Array.from({ length: frames }, (_, frame) => Array.from({ length: parts }, (_, part) => readKeyframe(binary, 16 + (frame * parts + part) * 12)));
  const animation = modelAnimation('TMD animation', result);
  animation.fps = PREVIEW_FPS / 2;
  animation.warnings.push('Standard animation shows stored keyframes at 15 Hz; SC interpolates between them at 30 Hz');
  return animation;
}

function decodeCmb(binary: AssetBinary): ModelAnimation {
  binary.check(0, 16);
  const parts = count(binary.u16(12), 'CMB model part');
  const frameCount = count(binary.u16(14), 'CMB frame');
  ensureTransformCount(frameCount, parts);
  const current = Array.from({ length: parts }, (_, part) => readKeyframe(binary, 16 + part * 12));
  const frames: PartTransform[][] = [cloneFrame(current)];
  const base = 16 + parts * 12;
  for (let frame = 1; frame < frameCount; frame++) {
    for (let part = 0; part < parts; part++) applyCmbDelta(current[part], binary, base + ((frame - 1) * parts + part) * 8);
    frames.push(cloneFrame(current));
  }
  const animation = modelAnimation('CMB', frames);
  animation.fps = PREVIEW_FPS / 2;
  animation.warnings.push('CMB shows stored keyframes at 15 Hz; SC interpolates between them at 30 Hz');
  return animation;
}

function decodeLmb0(binary: AssetBinary): ModelAnimation {
  const parts = readLmbPartCount(binary);
  binary.check(8, parts * 12);
  const records = Array.from({ length: parts }, (_, part) => ({
    keyframes: count(binary.u16(8 + part * 12 + 4), `LMB 0 part ${part} keyframe`),
    offset: binary.u32(8 + part * 12 + 8),
  }));
  const frameCount = records[0]?.keyframes ?? 0;
  ensureTransformCount(frameCount, parts);
  if (records.some((record) => record.keyframes < frameCount)) throw new Error('LMB 0 part keyframe count is shorter than part 0');
  const frames = Array.from({ length: frameCount }, (_, frame) => records.map((record) => toPartTransform(readLmbTransform(binary, record.offset + frame * 20))));
  return modelAnimation('LMB 0', frames);
}

function decodeLmb1(binary: AssetBinary): ModelAnimation {
  const parts = readLmbPartCount(binary);
  binary.check(8, 16);
  const dataBytesPerTransition = binary.i16(8);
  const frameCount = count(binary.i16(10), 'LMB 1 keyframe');
  if (dataBytesPerTransition < 0 || dataBytesPerTransition % 2 !== 0) throw new Error(`Invalid LMB 1 transform data size ${dataBytesPerTransition}`);
  ensureTransformCount(frameCount, parts);
  const flagsOffset = binary.u32(12);
  const initialOffset = binary.u32(16);
  const dataOffset = binary.u32(20);
  const flags = Array.from({ length: parts }, (_, part) => binary.u16(flagsOffset + part * 4));
  const current = Array.from({ length: parts }, (_, part) => readLmbTransform(binary, initialOffset + part * 20));
  const frames: PartTransform[][] = [current.map(toPartTransform)];
  let cursor = dataOffset;
  for (let frame = 1; frame < frameCount; frame++) {
    const end = cursor + dataBytesPerTransition;
    binary.check(cursor, dataBytesPerTransition);
    for (let part = 0; part < parts; part++) cursor = applyLmb1Values(current[part], flags[part], binary, cursor);
    if (cursor !== end) throw new Error(`LMB 1 transition ${frame} consumed ${cursor - (end - dataBytesPerTransition)} bytes, expected ${dataBytesPerTransition}`);
    frames.push(current.map(toPartTransform));
  }
  return modelAnimation('LMB 1', frames);
}

function decodeLmb2(binary: AssetBinary): ModelAnimation {
  const parts = readLmbPartCount(binary);
  binary.check(8, 16);
  const packedBytesPerTransition = binary.i16(8);
  const frameCount = count(binary.i16(10), 'LMB 2 keyframe');
  if (packedBytesPerTransition < 0) throw new Error(`Invalid LMB 2 packed data size ${packedBytesPerTransition}`);
  ensureTransformCount(frameCount, parts);
  const flagsOffset = binary.u32(12);
  const initialOffset = binary.u32(16);
  const dataOffset = binary.u32(20);
  const flags = Array.from({ length: parts }, (_, part) => binary.u32(flagsOffset + part * 4));
  const current = Array.from({ length: parts }, (_, part) => readLmbTransform(binary, initialOffset + part * 20));
  const frames: PartTransform[][] = [current.map(toPartTransform)];
  for (let frame = 1; frame < frameCount; frame++) {
    const nibbles = unpackSignedNibbles(binary, dataOffset + (frame - 1) * packedBytesPerTransition, packedBytesPerTransition);
    // SC unpacks into a persistent 0x300-byte scratch array. Some valid LMBs
    // (Gravity Grabber's second component) consume its untouched tail.
    while (nibbles.length < 0x300) nibbles.push(0);
    let cursor = 0;
    for (let part = 0; part < parts; part++) cursor = applyLmb2Delta(current[part], flags[part], nibbles, cursor);
    if (cursor > nibbles.length) throw new Error(`LMB 2 transition ${frame} exceeds its packed transform data`);
    frames.push(current.map(toPartTransform));
  }
  return modelAnimation('LMB 2', frames);
}

function readAnmGroup(binary: AssetBinary, offset: number): SpritePiece[] {
  const spriteCount = count(binary.i32(offset), 'ANM sprite');
  binary.check(offset + 4, spriteCount * 20);
  return Array.from({ length: spriteCount }, (_, index) => {
    const value = offset + 4 + index * 20;
    const tpage = binary.u16(value + 6);
    return {
      x: -binary.u16(value + 8) / 2,
      y: 0,
      width: binary.u16(value + 8),
      height: binary.u16(value + 10),
      u: binary.u8(value),
      v: binary.u8(value + 1),
      clut: binary.u16(value + 4),
      tpage,
      rotation: binary.u16(value + 12) * PSX_ANGLE_TO_RADIAN,
      flipX: false,
      flipY: false,
    };
  });
}

function readKeyframe(binary: AssetBinary, offset: number): PartTransform {
  return {
    rotation: rotation(binary.i16(offset), binary.i16(offset + 2), binary.i16(offset + 4)),
    translation: vector(binary.i16(offset + 6), binary.i16(offset + 8), binary.i16(offset + 10)),
    scale: [1, 1, 1],
  };
}

function applyCmbDelta(transform: PartTransform, binary: AssetBinary, offset: number): void {
  const rotationScale = 1 << binary.u8(offset);
  const translationScale = 1 << binary.u8(offset + 4);
  transform.rotation[0] += binary.i8(offset + 1) * rotationScale * PSX_ANGLE_TO_RADIAN;
  transform.rotation[1] += binary.i8(offset + 2) * rotationScale * PSX_ANGLE_TO_RADIAN;
  transform.rotation[2] += binary.i8(offset + 3) * rotationScale * PSX_ANGLE_TO_RADIAN;
  transform.translation[0] += binary.i8(offset + 5) * translationScale;
  transform.translation[1] += binary.i8(offset + 6) * translationScale;
  transform.translation[2] += binary.i8(offset + 7) * translationScale;
}

/** Stateful SC type-2 sampler. The scene shares scratch across LMB managers,
 * matching LmbAnimationEffect5c rather than decoding each resource in isolation. */
export class Lmb2Playback {
  private binary: AssetBinary;
  private flags: number[];
  private initial: LmbTransform[];
  private current: LmbTransform[];
  private previous = 0;
  private pairs: number;
  private frames: number;
  private offset: number;
  constructor(bytes: Uint8Array) {
    this.binary = new AssetBinary(bytes);
    const parts = readLmbPartCount(this.binary);
    this.pairs = this.binary.u16(8);
    this.frames = count(this.binary.u16(10), 'LMB 2 keyframe');
    ensureTransformCount(this.frames, parts);
    this.offset = this.binary.u32(20);
    this.binary.check(this.offset, this.pairs * (this.frames - 1));
    this.flags = Array.from({ length: parts }, (_, i) => this.binary.u32(this.binary.u32(12) + i * 4));
    this.initial = Array.from({ length: parts }, (_, i) => readLmbTransform(this.binary, this.binary.u32(16) + i * 20));
    this.current = structuredClone(this.initial);
  }
  sample(age: number, animateRotation: boolean, scratch: number[]): PartTransform[] {
    const tick = Math.max(0, age) % (this.frames * 2), keyframe = Math.floor(tick / 2), amount = tick % 2 / 2;
    if (keyframe < this.previous) { this.current = structuredClone(this.initial); this.previous = 0; }
    const unpack = (index: number) => {
      const values = unpackSignedNibbles(this.binary, this.offset + index * this.pairs, this.pairs);
      if (values.length > 0x300) throw new Error('LMB 2 scratch capacity exceeded');
      values.forEach((value, i) => scratch[i] = value);
    };
    while (this.previous < keyframe) {
      unpack(this.previous++);
      let cursor = 0;
      this.current.forEach((value, i) => cursor = applyLmb2Delta(value, this.flags[i], scratch, cursor));
    }
    const next = structuredClone(keyframe === this.frames - 1 ? this.initial : this.current);
    if (keyframe < this.frames - 1) {
      unpack(keyframe);
      let cursor = 0;
      next.forEach((value, i) => cursor = applyLmb2Delta(value, this.flags[i], scratch, cursor));
    }
    return this.current.map((value, i) => ({
      translation: value.translation.map((n, axis) => n + (next[i].translation[axis] - n) * amount) as Vec3,
      scale: value.scale.map((n, axis) => n + (next[i].scale[axis] - n) * amount) as Vec3,
      rotation: [...(animateRotation ? value.rotation : this.initial[i].rotation)],
    }));
  }
}

function readLmbTransform(binary: AssetBinary, offset: number): LmbTransform {
  return {
    scale: [binary.i16(offset) / 4096, binary.i16(offset + 2) / 4096, binary.i16(offset + 4) / 4096],
    translation: vector(binary.i16(offset + 6), binary.i16(offset + 8), binary.i16(offset + 10)),
    rotation: rotation(binary.i16(offset + 12), binary.i16(offset + 14), binary.i16(offset + 16)),
  };
}

function applyLmb1Values(transform: LmbTransform, flags: number, binary: AssetBinary, cursor: number): number {
  if (!(flags & 0x8000)) {
    transform.scale[0] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x4000)) {
    transform.scale[1] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x2000)) {
    transform.scale[2] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x1000)) {
    transform.translation[0] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x0800)) {
    transform.translation[1] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x0400)) {
    transform.translation[2] = binary.i16(cursor);
    cursor += 2;
  }
  if (!(flags & 0x0200)) {
    transform.rotation[0] = binary.i16(cursor) * PSX_ANGLE_TO_RADIAN;
    cursor += 2;
  }
  if (!(flags & 0x0100)) {
    transform.rotation[1] = binary.i16(cursor) * PSX_ANGLE_TO_RADIAN;
    cursor += 2;
  }
  if (!(flags & 0x0080)) {
    transform.rotation[2] = binary.i16(cursor) * PSX_ANGLE_TO_RADIAN;
    cursor += 2;
  }
  return cursor;
}

function unpackSignedNibbles(binary: AssetBinary, offset: number, byteCount: number): number[] {
  binary.check(offset, byteCount);
  const result: number[] = [];
  for (let index = 0; index < byteCount; index++) {
    const value = binary.u8(offset + index);
    const high = value >> 4;
    result.push((high & 0x8) ? high - 16 : high, (value & 0x8) ? (value & 0xf) - 16 : value & 0xf);
  }
  return result;
}

function applyLmb2Delta(transform: LmbTransform, flags: number, data: number[], cursor: number): number {
  const next = (): number => {
    const value = data[cursor++];
    if (value === undefined) throw new Error('LMB 2 packed transform data ended early');
    return value;
  };
  if ((flags & 0xe000) !== 0xe000) {
    const shift = next() & 0xf;
    if (!(flags & 0x8000)) transform.scale[0] += next() << shift;
    if (!(flags & 0x4000)) transform.scale[1] += next() << shift;
    if (!(flags & 0x2000)) transform.scale[2] += next() << shift;
  }
  if ((flags & 0x1c00) !== 0x1c00) {
    const shift = next() & 0xf;
    if (!(flags & 0x1000)) transform.translation[0] += next() << shift;
    if (!(flags & 0x0800)) transform.translation[1] += next() << shift;
    if (!(flags & 0x0400)) transform.translation[2] += next() << shift;
  }
  if ((flags & 0x0380) !== 0x0380) {
    const shift = next() & 0xf;
    if (!(flags & 0x0200)) transform.rotation[0] += (next() << shift) * PSX_ANGLE_TO_RADIAN;
    if (!(flags & 0x0100)) transform.rotation[1] += (next() << shift) * PSX_ANGLE_TO_RADIAN;
    if (!(flags & 0x0080)) transform.rotation[2] += (next() << shift) * PSX_ANGLE_TO_RADIAN;
  }
  return cursor;
}

function readLmbPartCount(binary: AssetBinary): number {
  return count(binary.i32(4), 'LMB object');
}

function modelAnimation(format: string, frames: PartTransform[][]): ModelAnimation {
  return {
    format,
    fps: PREVIEW_FPS,
    frames,
    warnings: ['Transforms use SC coordinate units and radians. Compose each [x, y, z] rotation with SC/JOML rotationZYX(z, y, x), equivalent to Z then Y then X Euler application'],
  };
}

function toPartTransform(transform: LmbTransform): PartTransform {
  return { scale: [...transform.scale], translation: [...transform.translation], rotation: [...transform.rotation] };
}

function cloneFrame(frame: PartTransform[]): PartTransform[] {
  return frame.map((transform) => ({ scale: [...transform.scale], translation: [...transform.translation], rotation: [...transform.rotation] }));
}

function vector(x: number, y: number, z: number): [number, number, number] {
  return [x, y, z];
}

function rotation(x: number, y: number, z: number): [number, number, number] {
  return [x * PSX_ANGLE_TO_RADIAN, y * PSX_ANGLE_TO_RADIAN, z * PSX_ANGLE_TO_RADIAN];
}

function count(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_FRAMES) throw new Error(`Invalid ${label} count ${value}`);
  return value;
}

function ensureTransformCount(frames: number, parts: number): void {
  if (frames * parts > MAX_TRANSFORMS) throw new Error(`Animation has ${frames * parts} transforms, exceeding the ${MAX_TRANSFORMS} preview limit`);
  if (parts > MAX_PARTS) throw new Error(`Animation has ${parts} parts, exceeding the ${MAX_PARTS} preview limit`);
}
