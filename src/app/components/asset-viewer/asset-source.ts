export interface AssetFileHandle { kind: 'file'; name: string; getFile(): Promise<File>; }
export interface AssetDirectoryHandle {
  kind: 'directory'; name: string;
  values(): AsyncIterable<AssetDirectoryHandle | AssetFileHandle>;
  getDirectoryHandle?(name: string): Promise<AssetDirectoryHandle>;
  getFileHandle?(name: string): Promise<AssetFileHandle>;
}
export const MAX_ASSET_BYTES = 128 * 1024 * 1024;
export async function fileBytes(file: File): Promise<Uint8Array> {
  if (file.size > MAX_ASSET_BYTES) throw new Error('This resource exceeds the 128 MiB preview limit');
  return new Uint8Array(await file.arrayBuffer());
}

/** Resolves only the selected path; never recursively walks the user's extraction. */
export class AssetSource {
  private readonly directories = new Map<string, AssetDirectoryHandle>();
  constructor(readonly root: AssetDirectoryHandle) { this.directories.set('', root); }
  private parts(path: string) {
    const parts = path.split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || part.includes('\\') || part.includes(':'))) throw new Error('Invalid asset path');
    return parts;
  }
  async directory(path: string): Promise<AssetDirectoryHandle> {
    if (!path) return this.root;
    const existing = this.directories.get(path);
    if (existing) return existing;
    const parts = this.parts(path);
    const name = parts.pop()!;
    const parent = await this.directory(parts.join('/'));
    let result: AssetDirectoryHandle | undefined;
    if (parent.getDirectoryHandle) result = await parent.getDirectoryHandle(name);
    else for await (const entry of parent.values()) if (entry.kind === 'directory' && entry.name === name) result = entry;
    if (!result) throw new Error(`Folder not found: ${path}`);
    this.directories.set(path, result);
    return result;
  }
  private async directFile(directory: AssetDirectoryHandle, name: string): Promise<File> {
    if (directory.getFileHandle) return (await directory.getFileHandle(name)).getFile();
    for await (const entry of directory.values()) if (entry.kind === 'file' && entry.name === name) return entry.getFile();
    throw new Error(`File not found: ${name}`);
  }
  async file(path: string): Promise<File> {
    const parts = this.parts(path);
    const name = parts.pop()!;
    const directory = await this.directory(parts.join('/'));
    try { return await this.directFile(directory, name); }
    catch (error) {
      if (!/^\d+$/.test(name)) throw error;
      const mappingFile = await this.directFile(directory, 'mrg');
      if (mappingFile.size > 4 * 1024 * 1024) throw new Error('Archive mapping exceeds preview limit');
      const mapping = new Map((await mappingFile.text()).trim().split(/\r?\n/).map(line => {
        const match = /^(\d+)=(\d*);(\d+)$/.exec(line);
        if (!match) throw new Error('Invalid archive mapping');
        return [match[1], { target: match[2], size: Number(match[3]) }] as const;
      }));
      let target = name;
      const visited = new Set<string>();
      while (mapping.has(target) && mapping.get(target)!.target !== target) {
        if (visited.has(target)) throw new Error('Cyclic archive mapping');
        visited.add(target);
        target = mapping.get(target)!.target;
      }
      if (!target || target === name) throw error;
      return this.directFile(directory, target);
    }
  }
  async read(path: string) { return fileBytes(await this.file(path)); }
}
