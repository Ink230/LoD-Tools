import { describe, expect, it } from 'vitest';
import { AssetRecord, battleStageId, gameIdentity, linkBattleStages } from './asset-catalog';
import { BattleBackdrop, battleBackdropPlacement } from './asset-battle-stage';
import { entityLinks } from './asset-entity-links';

describe('battle stage compositions', () => {
  const record = (path: string, format: AssetRecord['format']): AssetRecord => ({ path, format, name: path.split('/').at(-1)!, size: 1, category: '', ...gameIdentity(path) });

  it('links textures and backdrop from the parent package, and keeps source references on images', () => {
    const root = 'SECT/DRGN0.BIN/2497';
    const assets = [record(`${root}/0/0`, 'TMD'), record(`${root}/0/1`, 'Animation'), record(`${root}/1`, 'MCQ'), record(`${root}/2`, 'TIM')];
    linkBattleStages(assets);
    for (const asset of assets) {
      expect(asset.gameCategory).toBe('battle-stages');
      expect(asset.battleStageId).toBe(0);
      expect(asset.model).toBe(`${root}/0/0`);
      expect(asset.textures).toEqual([`${root}/2`]);
      expect(asset.backdrop).toBe(`${root}/1`);
    }
    const links = entityLinks(assets[2], assets);
    expect(links.find(group => group.label === 'Animations')!.assets).toEqual([assets[1]]);
    expect(links.find(group => group.label === 'Background')!.assets).toEqual([assets[2]]);
  });

  it('bounds retail stage classification and does not invent missing resources', () => {
    expect(battleStageId('SECT/DRGN0.BIN/2496/0')).toBeNull();
    expect(battleStageId('SECT/DRGN0.BIN/2592/0/0')).toBe(95);
    expect(battleStageId('SECT/DRGN0.BIN/2593/0')).toBeNull();
    expect(battleStageId('SECT/DRGN21.BIN/2497/0')).toBeNull();
    const assets = [record('SECT/DRGN0.BIN/2516/0/0', 'Unknown')];
    linkBattleStages(assets);
    expect(assets[0].model).toBeUndefined();
    expect(assets[0].backdrop).toBeUndefined();
    expect(assets[0].textures).toEqual([]);
  });

  it('scrolls a repeating skybox using SC camera angles and MCQ offsets', () => {
    const backdrop: BattleBackdrop = { image: { width: 320, height: 240, pixels: new Uint8ClampedArray() }, offsetX: 0, offsetY: 0, above: [1, 2, 3], below: [4, 5, 6] };
    expect(battleBackdropPlacement(backdrop, [1, 0, 0])).toEqual({ left: 0, top: -40, clear: backdrop.below });
    expect(battleBackdropPlacement(backdrop, [1, 0, 1]).left).toBe(160);
    const shifted = battleBackdropPlacement({ ...backdrop, offsetX: 12, offsetY: 64 }, [1, 0, 0]);
    expect(shifted).toEqual({ left: 12, top: 24, clear: backdrop.above });
    expect(battleBackdropPlacement(backdrop, [1, -1, 0]).top).toBe(472);
  });
});
