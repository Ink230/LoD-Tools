import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AssetViewerComponent } from './asset-viewer.component';

describe('asset explorer', () => {
  it('lists handles without reading files and only gets metadata for the selected file', async () => {
    const fixture = TestBed.createComponent(AssetViewerComponent);
    const viewer = fixture.componentInstance;
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
    expect(readContents).not.toHaveBeenCalled();
    expect(viewer.selectedPath).toBe('files/1');
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
