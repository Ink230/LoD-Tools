export type Vec3 = [number, number, number];
export interface PixelImage { width: number; height: number; pixels: Uint8ClampedArray; }
export interface TextureImage extends PixelImage {
  format: 'TIM' | 'MCQ';
  bpp: number;
  imageX: number;
  imageY: number;
  paletteCount: number;
  paletteIndex: number;
}
export interface ModelPrimitive {
  indices: number[];
  colors: [number, number, number][];
  uvs?: [number, number][];
  clut?: number;
  tpage?: number;
  translucent?: boolean;
  unlit?: boolean;
}
export interface ModelPart {
  billboard?: boolean; vertices: Vec3[]; normals: Vec3[]; primitives: ModelPrimitive[]; }
export interface ModelAsset { format: string; parts: ModelPart[]; warnings: string[]; }
export interface PartTransform { colour?: Vec3; visible?: boolean; screenRotation?: Vec3; translation: Vec3; rotation: Vec3; scale: Vec3; }
export interface ModelAnimation { format: string; fps: number; frames: PartTransform[][]; warnings: string[]; cameras?: ({ position: Vec3; target: Vec3 } | undefined)[]; flashes?: (Vec3 | undefined)[]; }
export interface SpritePiece {
  x: number; y: number; width: number; height: number;
  u: number; v: number; clut: number; tpage: number;
  rotation: number; flipX: boolean; flipY: boolean;
}
export interface SpriteFrame { duration: number; pieces: SpritePiece[]; }
export interface SpriteAnimation { format: 'ANM'; fps: number; frames: SpriteFrame[]; warnings: string[]; }
export interface PaletteAnimation { frames: number[][]; fps: number; warnings: string[]; }
export interface SceneOverlay {
  format: string;
  camera?: { position: Vec3; target: Vec3; projectionDistance: number; rotation: number };
  polygons: { points: Vec3[]; label: string }[];
  records: { label: string; values: Record<string, string | number> }[];
  warnings: string[];
}

export interface CollisionSelection {
  index: number;
  label: string;
  points: Vec3[];
  values: Record<string, string | number>;
}
