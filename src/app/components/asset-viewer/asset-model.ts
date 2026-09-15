import { AssetBinary } from './asset-binary';
import { ModelAsset, ModelPart, ModelPrimitive, Vec3 } from './asset-preview-types';

const TMD_FLAG = 0x41;
const CTMD_FLAG = 0x2;
const MAX_OBJECTS = 4096;

interface TmdLocation {
  start: number;
  format: 'TMD' | 'TMD with ID' | 'CContainer';
}

export function decodeModel(bytes: Uint8Array): ModelAsset {
  const data = new AssetBinary(bytes);
  const location = locateTmd(data);
  const flags = data.u32(location.start);

  if ((flags & CTMD_FLAG) !== 0)
    throw new Error('Compressed CTMD is not previewable. Select SC\'s extracted, transformed model instead');

  if ((flags & ~0x3) !== 0 || (flags & 0x1) !== 0)
    throw new Error(`Unsupported TMD flags 0x${flags.toString(16)}`);

  const objectCount = data.u32(location.start + 4);
  if (objectCount > MAX_OBJECTS)
    throw new Error(`Invalid TMD object count: ${objectCount}`);

  const objectTable = location.start + 8;
  data.check(objectTable, objectCount * 0x1c);
  const warnings: string[] = [];
  const parts: ModelPart[] = [];

  for (let index = 0; index < objectCount; index++)
    parts.push(decodePart(data, objectTable, objectTable + index * 0x1c, index, warnings));

  return { format: location.format, parts, warnings };
}

function locateTmd(data: AssetBinary): TmdLocation {
  if (data.bytes.length < 12) throw new Error('Truncated model header');
  if (data.u32(0) === TMD_FLAG && looksLikeTmdHeader(data, 4)) return { start: 4, format: 'TMD with ID' };
  if (looksLikeTmdHeader(data, 0)) return { start: 0, format: 'TMD' };

  const tmdWithId = data.u32(0);
  if (tmdWithId >= 12 && tmdWithId <= data.bytes.length - 12 && data.u32(tmdWithId) === TMD_FLAG && looksLikeTmdHeader(data, tmdWithId + 4))
    return { start: tmdWithId + 4, format: 'CContainer' };
  if (tmdWithId >= 12 && looksLikeTmdHeader(data, tmdWithId)) return { start: tmdWithId, format: 'CContainer' };

  throw new Error('Unrecognized model: expected TMD, TmdWithId, or CContainer');
}

function looksLikeTmdHeader(data: AssetBinary, start: number): boolean {
  if (start < 0 || start > data.bytes.length - 8) return false;
  const flags = data.u32(start);
  const objectCount = data.u32(start + 4);
  return (flags & ~0x3) === 0 && objectCount <= MAX_OBJECTS && start + 8 + objectCount * 0x1c <= data.bytes.length;
}

function decodePart(data: AssetBinary, base: number, table: number, partIndex: number, warnings: string[]): ModelPart {
  const vertexOffset = pointer(data, base, data.i32(table));
  const vertexCount = checkedCount(data.u32(table + 4), `part ${partIndex} vertex`);
  const normalOffset = pointer(data, base, data.i32(table + 8));
  const normalCount = checkedCount(data.u32(table + 12), `part ${partIndex} normal`);
  const primitiveOffset = pointer(data, base, data.i32(table + 16));
  const primitiveCount = checkedCount(data.u32(table + 20), `part ${partIndex} primitive`);
  data.check(vertexOffset, vertexCount * 8);
  data.check(normalOffset, normalCount * 8);

  const vertices = readVectors(data, vertexOffset, vertexCount);
  const normals = readVectors(data, normalOffset, normalCount);
  const primitives = readPrimitives(data, primitiveOffset, primitiveCount, vertexCount, partIndex, warnings);
  return { vertices, normals, primitives };
}

function pointer(data: AssetBinary, base: number, relative: number): number {
  const offset = base + relative;
  data.check(offset, 0);
  return offset;
}

function checkedCount(value: number, description: string): number {
  if (value > 1_000_000) throw new Error(`Invalid ${description} count: ${value}`);
  return value;
}

function readVectors(data: AssetBinary, offset: number, count: number): Vec3[] {
  const values: Vec3[] = [];
  for (let index = 0; index < count; index++) {
    const position = offset + index * 8;
    values.push([data.i16(position), data.i16(position + 2), data.i16(position + 4)]);
  }
  return values;
}

function readPrimitives(data: AssetBinary, offset: number, count: number, vertexCount: number, partIndex: number, warnings: string[]): ModelPrimitive[] {
  const primitives: ModelPrimitive[] = [];
  let cursor = offset;

  for (let index = 0; index < count; index++) {
    data.check(cursor, 4);
    const header = data.u32(cursor);
    const command = header >>> 24;
    const packetSize = (header >>> 8 & 0xff) * 4;
    cursor += 4;

    if (packetSize === 0) {
      warnings.push(`Part ${partIndex} primitive ${index} has no packet data`);
      continue;
    }
    data.check(cursor, packetSize);
    try {
      const primitive = decodePacket(data, cursor, command, header, vertexCount);
      if (primitive) primitives.push(primitive);
      else warnings.push(`Part ${partIndex} primitive ${index} uses unsupported command 0x${command.toString(16)}`);
    } catch (error) {
      warnings.push(`Part ${partIndex} primitive ${index} is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    cursor += packetSize;
  }

  return primitives;
}

function decodePacket(data: AssetBinary, offset: number, command: number, header: number, vertexCount: number): ModelPrimitive | undefined {
  if (((command >>> 5) & 0b11) !== 1) return undefined;
  const corners = (command & 0x8) !== 0 ? 4 : 3;
  const gouraud = (command & 0x10) !== 0;
  const textured = (command & 0x4) !== 0;
  const translucent = (command & 0x2) !== 0;
  const unlit = (command & 0x1) !== 0;
  const shaded = (header & 0x40000) !== 0;
  if ((textured && shaded) || (!textured && unlit)) return undefined;

  let cursor = offset;
  let uvs: [number, number][] | undefined;
  let clut: number | undefined;
  let tpage: number | undefined;
  if (textured) {
    uvs = [];
    for (let corner = 0; corner < corners; corner++) {
      uvs.push([data.u8(cursor), data.u8(cursor + 1)]);
      if (corner === 0) clut = data.u16(cursor + 2);
      if (corner === 1) tpage = data.u16(cursor + 2);
      cursor += 4;
    }
  }

  const colors: [number, number, number][] = [];
  if (shaded || unlit) {
    for (let corner = 0; corner < corners; corner++) {
      colors.push(color(data.u32(cursor)));
      cursor += 4;
    }
  } else if (!textured) {
    const value = color(data.u32(cursor));
    cursor += 4;
    for (let corner = 0; corner < corners; corner++) colors.push(value);
  } else {
    for (let corner = 0; corner < corners; corner++) colors.push([255, 255, 255]);
  }

  const cornerIndices: number[] = [];
  for (let corner = 0; corner < corners; corner++) {
    if (!unlit && (gouraud || corner === 0)) cursor += 2;
    const vertex = data.u16(cursor);
    if (vertex >= vertexCount) throw new Error(`Primitive references vertex ${vertex}, but the part has ${vertexCount}`);
    cornerIndices.push(vertex);
    cursor += 2;
  }

  return {
    indices: cornerIndices,
    colors,
    ...(uvs ? { uvs } : {}),
    ...(clut === undefined ? {} : { clut }),
    ...(tpage === undefined ? {} : { tpage }),
    ...(translucent ? { translucent: true } : {}),
    ...(unlit ? { unlit: true } : {}),
  };
}

function color(value: number): [number, number, number] {
  return [value & 0xff, value >>> 8 & 0xff, value >>> 16 & 0xff];
}
