import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetViewerComponent } from './asset-viewer.component';
import { AssetDirectoryHandle, AssetFileHandle } from './asset-source';
import { AssetRecord } from './asset-catalog';

const record: AssetRecord = { path: 'texture.tim', name: 'texture', format: 'TIM', category: 'textures', gameCategory: '', gameAsset: '', size: 1 };
const directory = (entries: (AssetFileHandle | AssetDirectoryHandle)[]): AssetDirectoryHandle => ({
  kind: 'directory', name: 'files',
  async *values() { yield* entries; },
});
const file = (getFile: () => Promise<File>): AssetFileHandle => ({ kind: 'file', name: record.path, getFile });

describe('folder connection', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('releases both folder initiators while asset validation is pending and ignores duplicate clicks', async () => {
    let resolveFile!: (file: File) => void;
    const pending = new Promise<File>(resolve => { resolveFile = resolve; });
    const picker = vi.fn().mockResolvedValue(directory([file(() => pending)]));
    vi.stubGlobal('showDirectoryPicker', picker);
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    viewer.catalog = { version: 1, extractionVersion: 'test', assets: [record] };
    const opening = viewer.connectFolder();
    await viewer.connectFolder();
    await opening;
    expect(picker).toHaveBeenCalledTimes(1);
    expect(viewer.busy).toBe(false);
    expect(viewer.source).toBeTruthy();
    expect(viewer.folderAssetsLoaded).toBe(false);
    resolveFile(new File(['data'], record.path));
    await vi.waitFor(() => expect(viewer.folderAssetsLoaded).toBe(true));
  });

  it('detects assets when the catalog arrives after the folder is connected', async () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn().mockResolvedValue(directory([file(async () => new File(['data'], record.path))])));
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    await viewer.connectFolder();
    expect(viewer.busy).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ version: 1, extractionVersion: 'test', assets: [record] }))));
    await viewer.loadCatalog();
    await vi.waitFor(() => expect(viewer.folderAssetsLoaded).toBe(true));
  });

  it('ignores validation from a folder that has since been replaced', async () => {
    let resolveFile!: (file: File) => void;
    const pending = new Promise<File>(resolve => { resolveFile = resolve; });
    const getFile = vi.fn(() => pending);
    const picker = vi.fn().mockResolvedValueOnce(directory([file(getFile)])).mockResolvedValueOnce(directory([]));
    vi.stubGlobal('showDirectoryPicker', picker);
    const viewer = TestBed.createComponent(AssetViewerComponent).componentInstance;
    viewer.catalog = { version: 1, extractionVersion: 'test', assets: [record] };
    await viewer.connectFolder();
    await vi.waitFor(() => expect(getFile).toHaveBeenCalled());
    await viewer.connectFolder();
    resolveFile(new File(['data'], record.path));
    await pending;
    expect(viewer.busy).toBe(false);
    expect(viewer.folderAssetsLoaded).toBe(false);
  });
});
