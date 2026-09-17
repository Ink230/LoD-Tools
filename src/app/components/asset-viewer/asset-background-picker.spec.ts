import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AssetRecord } from './asset-catalog';
import { AssetPreviewComponent } from './asset-preview.component';
import { AssetCompanionPickerComponent } from './asset-companion-picker.component';

const backdrop: AssetRecord = { path: 'SECT/DRGN0.BIN/2497/1', name: '1', format: 'MCQ', category: 'images', gameCategory: 'battle-stages', gameAsset: 'Battle stage 0', size: 1, battleStageId: 0 };

describe('model background picker', () => {
  it('intersects category and file-type buttons with search and resets pagination', () => {
    const picker = new AssetCompanionPickerComponent();
    picker.kind = 'background';
    picker.includeGameResources = true;
    picker.assets = [backdrop, { ...backdrop, path: 'stage.tim', format: 'TIM' }, { ...backdrop, path: 'portrait.png', format: 'PNG', battleStageId: undefined }, { ...backdrop, path: 'scene', format: 'Environment', battleStageId: undefined }];
    picker.backgroundGroup = 'battle-stages';
    picker.backgroundFormat = 'TIM';
    expect(picker.filtered.map(asset => asset.path)).toEqual(['stage.tim']);
    picker.page = 3;
    picker.backgroundGroup = 'backgrounds';
    expect(picker.filtered).toEqual([]);
    expect(picker.page).toBe(0);
    picker.backgroundFormat = '';
    picker.search = 'portrait';
    expect(picker.filtered.map(asset => asset.path)).toEqual(['portrait.png']);
    picker.search = '';
    picker.backgroundGroup = 'textures';
    expect(picker.filtered.map(asset => asset.path)).toEqual(['stage.tim']);
  });

  it('keeps a stable list of compatible backgrounds and selects one at a time', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.assets = [backdrop, { ...backdrop, path: 'art.mcq', battleStageId: undefined }, { ...backdrop, path: 'texture.tim', format: 'TIM' }, { ...backdrop, path: 'art.png', format: 'PNG' }, { ...backdrop, path: 'scene', format: 'Environment' }, { ...backdrop, path: 'model', format: 'TMD' }];
    expect(preview.backgroundAssets).toEqual(preview.assets.slice(0, 5));
    expect(preview.backgroundAssets).toBe(preview.backgroundAssets);
    const picker = new AssetCompanionPickerComponent();
    picker.kind = 'background';
    picker.includeGameResources = true;
    picker.assets = preview.backgroundAssets;
    expect(picker.filtered).toEqual(preview.assets.slice(0, 5));
    picker.toggle(backdrop);
    const other = { ...backdrop, path: 'SECT/DRGN0.BIN/2498/1' };
    picker.toggle(other);
    expect([...picker.selected.values()]).toEqual([other]);
    fixture.destroy();
  });

  it('does not restore a pending background after clearing or closing the picker', async () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    try {
      for (const cancel of [() => preview.clearBackground(), () => preview.closeBackgroundPicker()]) {
        let finish!: (bytes: Uint8Array) => void;
        preview.readFile = () => new Promise(resolve => { finish = resolve; });
        const pending = preview.attachBackground(backdrop);
        cancel();
        // Invalid bytes would report a decode error if cancellation failed.
        finish(new Uint8Array());
        await pending;
        expect(preview.battleBackdrop).toBeNull();
        expect(preview.backgroundAsset).toBeNull();
        expect(preview.error).toBe('');
      }
    } finally { fixture.destroy(); }
  });
});
