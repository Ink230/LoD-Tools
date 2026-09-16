import type { EffectRuntimeMetadata } from './asset-effect-runtime';
export type AssetFormat = 'PNG' | 'TIM' | 'MCQ' | 'Opus' | 'TMD' | 'Animation' | 'CMB' | 'LMB' | 'ANM' | 'CLUT' | 'SPU' | 'Environment' | 'Collision' | 'CollisionInfo' | 'Unknown';
export interface AssetRecord {
  path: string;
  name: string;
  format: AssetFormat;
  category: string;
  gameCategory: string;
  gameAsset: string;
  size: number;
  model?: string;
  textures?: string[];
  environment?: string;
  collision?: string;
  collisionInfo?: string;
  battleStageId?: number;
  backdrop?: string;
  offset?: number;
  modelOffset?: number;
  lmbType?: number;
  effectRuntime?: EffectRuntimeMetadata;
}
export interface AssetCatalog { version: number; extractionVersion: string; assets: AssetRecord[]; }
export const PREVIEW_FORMATS: AssetFormat[] = ['PNG', 'TIM', 'MCQ', 'Opus', 'TMD', 'Animation', 'CMB', 'LMB', 'ANM', 'CLUT', 'SPU', 'Environment', 'Collision', 'CollisionInfo'];

/** Header recognition is deliberately conservative: numeric filenames are not extensions. */
export function identifyAsset(bytes: Uint8Array, path: string): AssetFormat {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u32 = (offset: number) => offset + 4 <= bytes.length ? view.getUint32(offset, true) : -1;
  const magic = u32(0);
  if (magic === 0x474e5089) return 'PNG';
  if (magic === 0x5367674f) return 'Opus';
  if (magic === 0x10 && (u32(4) & ~0xb) === 0) return 'TIM';
  if (magic === 0x0151434d || magic === 0x0251434d) return 'MCQ';
  if (magic === 0x20424d43) return 'CMB';
  if (magic === 0x00424d4c) return 'LMB';
  if ((magic & 0xffff) === 0x41 || (u32(4) & 0xffff) === 0x41 || (magic >= 12 && magic <= 128 && magic % 4 === 0 && ((u32(magic) & 0xffff) === 0x41 || (u32(magic + 4) & 0xffff) === 0x41))) return 'TMD';
  if (magic === 12 && u32(4) === 0 && u32(8) === 0 && bytes.length >= 16 && view.getUint16(12, true) > 0 && view.getUint16(14, true) > 0) return 'Animation';
  if (bytes[0] === 0x21 && bytes[1] === 3 && bytes.length >= 16) return 'ANM';
  if (/\/sounds\/(?:.*\/)?3$/.test(path)) return 'SPU';
  return 'Unknown';
}

export function assetCategory(format: AssetFormat): string {
  if (['PNG', 'TIM', 'MCQ'].includes(format)) return 'images';
  if (['TMD', 'Animation', 'CMB', 'LMB', 'ANM', 'CLUT'].includes(format)) return 'models';
  if (['Opus', 'SPU'].includes(format)) return 'audio';
  if (['Environment', 'Collision', 'CollisionInfo'].includes(format)) return 'scenes';
  return 'effects';
}

export function gameIdentity(path: string): { gameCategory: string; gameAsset: string } {
  const parts = path.split('/');
  const title = (value: string) => value.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  const stage = battleStageId(path);
  if (stage !== null) return { gameCategory: 'battle-stages', gameAsset: `Battle stage ${stage}` };
  if (parts[0] === 'characters') return { gameCategory: 'party', gameAsset: title(parts[1]) };
  if (parts[0] === 'monsters') return { gameCategory: 'monsters', gameAsset: `Monster ${parts[1]}` };
  if (parts[0] === 'SUBMAP') return { gameCategory: 'interface', gameAsset: 'Field effects' };
  if (parts[0] === 'XA' || parts[0] === 'STR') return { gameCategory: 'media', gameAsset: parts.slice(0, -1).join('/') };
  if (/^SECT\/DRGN2[1-4]\.BIN\//.test(path)) return { gameCategory: 'submap-resources', gameAsset: `Submap resources · ${parts[1]}/${parts[2]}` };
  if (parts[0] === 'SECT') return { gameCategory: 'game-resources', gameAsset: `Game resources · ${parts[1]}/${parts[2]}` };
  return { gameCategory: 'interface', gameAsset: parts[0] === 'goods' ? title(parts[1]) : 'Interface & shared assets' };
}

/** Battle.loadStage uses DRGN0 packages 2497 + stage; Ambiance defines 96 retail stages. */
export function battleStageId(path: string): number | null {
  const match = /^SECT\/DRGN0\.BIN\/(\d+)\//.exec(path);
  const id = match ? Number(match[1]) - 2497 : -1;
  return id >= 0 && id < 96 ? id : null;
}

export function linkBattleStages(assets: AssetRecord[]): void {
  const byPath = new Map(assets.filter(asset => !asset.offset).map(asset => [asset.path, asset]));
  for (const asset of assets) {
    const id = battleStageId(asset.path);
    if (id === null) continue;
    const root = `SECT/DRGN0.BIN/${2497 + id}`;
    const model = byPath.get(`${root}/0/0`);
    const texture = byPath.get(`${root}/2`);
    const backdrop = byPath.get(`${root}/1`);
    Object.assign(asset, gameIdentity(asset.path));
    asset.battleStageId = id;
    asset.model = model?.format === 'TMD' ? model.path : undefined;
    asset.textures = texture?.format === 'TIM' ? [texture.path] : [];
    asset.backdrop = backdrop?.format === 'MCQ' ? backdrop.path : undefined;
  }
}
