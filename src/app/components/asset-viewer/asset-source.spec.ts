import { describe, expect, it, vi } from 'vitest';
import { AssetDirectoryHandle, AssetSource, fileBytes } from './asset-source';

describe('local asset source', () => {
  it('resolves only the selected path and follows archive aliases without reading other payloads', async () => {
    const payload = new File(['model'], '32');
    const read = vi.spyOn(payload, 'arrayBuffer');
    const getFileHandle = vi.fn(async (name: string) => {
      if (name === '32') return { kind: 'file' as const, name, getFile: async () => payload };
      if (name === 'mrg') return { kind: 'file' as const, name, getFile: async () => new File(['0=32;5\n32=32;5\n'], 'mrg') };
      throw new Error('Missing');
    });
    const child: AssetDirectoryHandle = { kind: 'directory', name: 'models', values() { throw new Error('Should not enumerate'); }, getFileHandle };
    const getDirectoryHandle = vi.fn(async () => child);
    const root: AssetDirectoryHandle = { kind: 'directory', name: 'files', values() { throw new Error('Should not enumerate'); }, getDirectoryHandle };
    const source = new AssetSource(root);
    await source.file('models/0');
    expect(read).not.toHaveBeenCalled();
    expect([...(await source.read('models/0'))]).toEqual([...new TextEncoder().encode('model')]);
    expect(read).toHaveBeenCalledOnce();
    expect(getDirectoryHandle).toHaveBeenCalledOnce();
    expect(getFileHandle.mock.calls.map(call => call[0])).not.toContain('1');
  });
  it('rejects parent paths and cyclic archive aliases', async () => {
    const root: AssetDirectoryHandle = { kind: 'directory', name: 'files', async *values() { /* No files. */ }, async getFileHandle(name) {
      if (name !== 'mrg') throw new Error('Missing');
      return { kind: 'file', name, getFile: async () => new File(['0=1;4\n1=0;4\n'], 'mrg') };
    } };
    const source = new AssetSource(root);
    await expect(source.read('../outside')).rejects.toThrow('Invalid asset path');
    await expect(source.read('0')).rejects.toThrow('Cyclic');
  });
  it('rejects oversized resources before reading their bytes', async () => {
    const file = new File([], 'large'); Object.defineProperty(file, 'size', { value: 129 * 1024 * 1024 });
    const read = vi.spyOn(file, 'arrayBuffer');
    await expect(fileBytes(file)).rejects.toThrow('128 MiB');
    expect(read).not.toHaveBeenCalled();
  });
});
