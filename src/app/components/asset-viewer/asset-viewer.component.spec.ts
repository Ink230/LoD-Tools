import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AssetViewerComponent } from './asset-viewer.component';
import { AssetRecord, gameIdentity, assetCategory } from './asset-catalog';

describe('asset explorer', () => {
  it('separates archive categories and filters formats within By game asset', () => {
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    const asset = (path: string, format: AssetRecord['format']): AssetRecord => ({ path, name: path, format, size: 1, category: assetCategory(format), ...gameIdentity(path) });
    const submapModel = asset('SECT/DRGN21.BIN/5/33', 'TMD');
    const submapTexture = asset('SECT/DRGN21.BIN/5/textures/1', 'TIM');
    const gameModel = asset('SECT/DRGN0.BIN/0', 'TMD');
    viewer.catalog = { version: 1, extractionVersion: 'test', assets: [submapModel, submapTexture, gameModel] };
    viewer.setBrowseMode('game');
    viewer.chooseCategory('submap-resources');
    expect(viewer.filteredAssets).toEqual([submapModel, submapTexture]);
    expect(viewer.availableFormats).toEqual(['TMD', 'TIM']);
    viewer.gameFilter = submapModel.gameAsset;
    viewer.formatFilter = 'TIM';
    expect(viewer.filteredAssets).toEqual([submapTexture]);
    viewer.chooseCategory('game-resources');
    expect(viewer.filteredAssets).toEqual([gameModel]);
    expect(viewer.availableFormats).toEqual(['TMD']);
  });
  it('navigates imported entity history without opening a folder and truncates forward history', async () => {
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    const open = async (name: string) => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [new File(['asset'], name)] });
      await viewer.importFile({ target: input } as unknown as Event);
    };
    const connect = vi.spyOn(viewer, 'connectFolder');
    await open('first'); await open('second');
    await viewer.navigateHistory(-1);
    expect(viewer.selectedPath).toBe('first');
    await viewer.navigateHistory(1);
    expect(viewer.selectedPath).toBe('second');
    await viewer.navigateHistory(-1);
    await open('third');
    expect(viewer.entityHistory.map(asset => asset.path)).toEqual(['first', 'third']);
    expect(viewer.historyIndex).toBe(1);
    expect(connect).not.toHaveBeenCalled();
  });
  it('starts with formats and switches browse modes without discarding the open file', async () => {
    const fixture = TestBed.createComponent(AssetViewerComponent);
    const viewer = fixture.componentInstance;
    fixture.detectChanges();
    expect(viewer.browseMode).toBe('format');
    expect(fixture.nativeElement.querySelector('.section-list').textContent).toContain('Images & textures');
    const file = new File(['asset'], 'test.tim');
    await viewer.open({ kind: 'file', name: file.name, getFile: async () => file });
    viewer.search = 'nothing';
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.browse-modes button'));
    buttons[1].click();
    fixture.detectChanges();
    expect(viewer.browseMode).toBe('game');
    expect(viewer.search).toBe('');
    expect(fixture.nativeElement.querySelector('.section-list').textContent).toContain('Party members');
    buttons[2].click();
    fixture.detectChanges();
    expect(viewer.selected).toBe(file);
    expect(fixture.nativeElement.querySelector('.inspector').textContent).toContain('test.tim');
  });

  it('lists handles without reading files and reads only the selected payload', async () => {
    const fixture = TestBed.createComponent(AssetViewerComponent);
    const viewer = fixture.componentInstance;
    viewer.setBrowseMode('files');
    const file = new File(['asset'], '1');
    const readContents = vi.spyOn(file, 'arrayBuffer');
    const getFile = vi.fn(async () => file);
    const entry = { kind: 'file' as const, name: '1', getFile };
    const folder = { kind: 'directory' as const, name: 'files', async *values() { yield entry; } };

    await viewer.open(folder);
    expect(viewer.entries).toEqual([entry]);
    expect(getFile).not.toHaveBeenCalled();
    await viewer.open(entry);
    expect(getFile).toHaveBeenCalledOnce();
    expect(readContents).toHaveBeenCalledOnce();
    expect(viewer.selectedPath).toBe('1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('5 bytes');
  });

  it('preserves the current directory when navigation fails', async () => {
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    const folder = { kind: 'directory' as const, name: 'files', async *values() { yield { kind: 'directory' as const, name: 'empty', async *values() { /* Empty directory. */ } }; } };
    await viewer.open(folder);
    const previous = viewer.entries;
    const broken = { kind: 'directory' as const, name: 'missing', values(): ReturnType<typeof folder.values> { throw new Error('Access expired'); } };
    await viewer.open(broken);
    expect(viewer.path).toBe('files');
    expect(viewer.entries).toBe(previous);
    expect(viewer.error).toContain('Unable to open');
    expect(viewer.busy).toBe(false);
  });
});
