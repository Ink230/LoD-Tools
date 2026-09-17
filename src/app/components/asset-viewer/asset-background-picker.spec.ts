import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AssetRecord } from './asset-catalog';
import { AssetPreviewComponent } from './asset-preview.component';
import { AssetCompanionPickerComponent } from './asset-companion-picker.component';

const backdrop: AssetRecord = { path: 'SECT/DRGN0.BIN/2497/1', name: '1', format: 'MCQ', category: 'images', gameCategory: 'battle-stages', gameAsset: 'Battle stage 0', size: 1, battleStageId: 0 };

describe('model background picker', () => {
  it('keeps a stable list of compatible backgrounds and selects one at a time', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.assets = [backdrop, { ...backdrop, path: 'art.mcq', battleStageId: undefined }, { ...backdrop, format: 'TIM' }];
    expect(preview.backgroundAssets).toEqual([backdrop]);
    expect(preview.backgroundAssets).toBe(preview.backgroundAssets);
    const picker = new AssetCompanionPickerComponent();
    picker.kind = 'background';
    picker.includeGameResources = true;
    picker.assets = preview.backgroundAssets;
    expect(picker.filtered).toEqual([backdrop]);
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
