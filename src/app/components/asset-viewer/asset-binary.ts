export class AssetBinary {
  readonly view: DataView;
  constructor(readonly bytes: Uint8Array) { this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); }
  check(offset: number, length: number) {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > this.bytes.length) throw new Error(`Truncated asset: need ${length} bytes at 0x${offset.toString(16)}`);
  }
  u8(offset: number) { this.check(offset, 1); return this.view.getUint8(offset); }
  i8(offset: number) { this.check(offset, 1); return this.view.getInt8(offset); }
  u16(offset: number) { this.check(offset, 2); return this.view.getUint16(offset, true); }
  i16(offset: number) { this.check(offset, 2); return this.view.getInt16(offset, true); }
  u32(offset: number) { this.check(offset, 4); return this.view.getUint32(offset, true); }
  i32(offset: number) { this.check(offset, 4); return this.view.getInt32(offset, true); }
  slice(offset: number, length = this.bytes.length - offset) { this.check(offset, length); return this.bytes.subarray(offset, offset + length); }
}
