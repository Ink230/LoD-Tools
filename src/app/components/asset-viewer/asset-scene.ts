import { AssetBinary } from './asset-binary';
import { decodeModel } from './asset-model';
import { SceneOverlay, Vec3 } from './asset-preview-types';

export function decodeEnvironment(bytes: Uint8Array): SceneOverlay {
  const data = new AssetBinary(bytes);
  data.check(0, 0x18);
  const textureCount = data.u8(0x14);
  data.check(0x18, textureCount * 0x24);
  const records: SceneOverlay['records'] = [];

  for (let index = 0; index < textureCount; index++) {
    const offset = 0x18 + index * 0x24;
    records.push({
      label: `Environment texture ${index}`,
      values: {
        worldX: data.i16(offset), worldY: data.i16(offset + 2), worldZ: data.i16(offset + 4),
        tileType: data.i16(offset + 6), vramX: data.i16(offset + 8), vramY: data.i16(offset + 10),
        textureOffsetX: data.i16(offset + 16), textureOffsetY: data.i16(offset + 18),
        screenZ: data.i32(offset + 28) / 0x1000, tpage: data.u16(offset + 32), clutY: data.i16(offset + 34),
      },
    });
  }

  return {
    format: 'Submap environment',
    camera: {
      position: vector(data, 0), target: vector(data, 8), projectionDistance: data.u16(0x10), rotation: data.i16(0x12),
    },
    polygons: [],
    records,
    warnings: [],
  };
}

export function decodeCollision(modelBytes: Uint8Array, infoBytes?: Uint8Array): SceneOverlay {
  const model = decodeModel(modelBytes);
  const part = model.parts[0];
  if (!part) throw new Error('Collision model has no object table');
  const polygons = part.primitives.map((primitive, index) => ({
    points: perimeterPoints(primitive.indices, part.vertices),
    label: `Collision primitive ${index}`,
  }));
  const warnings = [...model.warnings];
  const records: SceneOverlay['records'] = [];

  if (infoBytes) readCollisionInfo(new AssetBinary(infoBytes), polygons.length, records, warnings);
  return { format: 'Submap collision', polygons, records, warnings };
}

function vector(data: AssetBinary, offset: number): Vec3 {
  return [data.i16(offset), data.i16(offset + 2), data.i16(offset + 4)];
}

function perimeterPoints(indices: number[], vertices: Vec3[]): Vec3[] {
  const order = indices.length === 4 ? [0, 1, 3, 2] : [0, 1, 2];
  return order.map(index => vertices[indices[index]]);
}

function readCollisionInfo(data: AssetBinary, primitiveCount: number, records: SceneOverlay['records'], warnings: string[]): void {
  const required = primitiveCount * 12;
  if (data.bytes.length < required) {
    warnings.push(`Collision-info file is truncated: expected at least ${required} bytes for ${primitiveCount} primitive records`);
    return;
  }

  for (let index = 0; index < primitiveCount; index++) {
    const offset = index * 12;
    records.push({
      label: `Collision primitive info ${index}`,
      values: {
        vertexCount: data.u8(offset), flatEnoughToWalkOn: data.i8(offset + 1) === 0 ? 0 : 1,
        vertexInfoOffset: data.u16(offset + 2), primitiveOffset: data.i32(offset + 4), planeOffset: data.i32(offset + 8),
      },
    });
  }
}
