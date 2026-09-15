import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AssetCompanionPickerComponent } from './asset-companion-picker.component';
import { AssetPreviewComponent } from './asset-preview.component';
import { AssetRecord } from './asset-catalog';

const record = (path: string, format: AssetRecord['format'], offset = 0): AssetRecord => ({ path, format, offset, name: path, size: 32, category: 'models', gameCategory: 'characters', gameAsset: 'Dart' });

describe('virtual companion chooser', () => {
  it('filters compatible references and preserves ordered multi-texture selection', () => {
    const picker = new AssetCompanionPickerComponent();
    const texture = record('textures/one', 'TIM'), second = record('textures/two', 'TIM');
    picker.assets = [texture, record('model', 'TMD'), second];
    expect(picker.filtered).toEqual([texture, second]);
    picker.toggle(second); picker.toggle(texture);
    expect([...picker.selected.values()]).toEqual([second, texture]);
    picker.search = 'one';
    expect(picker.filtered).toEqual([texture]);
    picker.kind = 'model'; picker.search = '';
    expect(picker.filtered.map(item => item.path)).toEqual(['model']);
  });

  it('shows cached previews without native file inputs or reading payloads', async () => {
    const fixture = TestBed.createComponent(AssetCompanionPickerComponent);
    fixture.componentInstance.assets = [record('texture', 'TIM')];
    fixture.componentInstance.thumbnails.set('texture@0', 'data:image/png;base64,AA==');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toContain('data:image/png');
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
  });

  it('loads an animation reference at its embedded offset through the viewer reader', async () => {
    TestBed.overrideComponent(AssetPreviewComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    const bytes = new Uint8Array(32);
    const view = new DataView(bytes.buffer);
    view.setUint16(4 + 12, 1, true); view.setUint16(4 + 14, 2, true);
    view.setInt16(4 + 22, 123, true);
    preview.record = record('current', 'TMD');
    preview.picker = 'animation';
    preview.readFile = vi.fn().mockResolvedValue(bytes);
    const animation = record('package/0', 'Animation', 4);
    await preview.attach([animation]);
    expect(preview.readFile).toHaveBeenCalledExactlyOnceWith('package/0');
    expect(preview.animation?.frames[0][0].translation[0]).toBe(123);
    expect(preview.animationPath).toBe('package/0@4');
    expect(preview.loadedCompanions.animation).toEqual([animation]);
    expect(preview.animations).toContain(animation);
    expect(preview.picker).toBeNull();
  });

  it('steps compatible entities in catalog order and wraps at either end', async () => {
    TestBed.overrideComponent(AssetPreviewComponent, { set: { template: '' } });
    const preview = TestBed.createComponent(AssetPreviewComponent).componentInstance;
    const first = record('package', 'Animation', 4), second = record('package', 'CMB', 40);
    preview.assets = [first, record('texture', 'TIM'), second];
    preview.loadedCompanions.animation = [first];
    const attach = vi.spyOn(preview, 'attach').mockResolvedValue();
    await preview.stepCompanion('animation', 1);
    expect(attach).toHaveBeenLastCalledWith([second], 'animation');
    await preview.stepCompanion('animation', -1);
    expect(attach).toHaveBeenLastCalledWith([second], 'animation');
    preview.loadedCompanions.animation = [second];
    await preview.stepCompanion('animation', 1);
    expect(attach).toHaveBeenLastCalledWith([first], 'animation');
  });
});
