import { describe, expect, it } from 'vitest';
import { decodeModel } from './asset-model';

function modelBytes(wrapper = false): Uint8Array {
  const bytes = new Uint8Array(0xa0);
  const view = new DataView(bytes.buffer);
  const start = wrapper ? 16 : 0;
  if (wrapper) {
    view.setUint32(0, 12, true);
    view.setUint32(12, 0x41, true);
  }
  view.setUint32(start, 0, true);
  view.setUint32(start + 4, 1, true);
  const table = start + 8;
  view.setUint32(table, 0x1c, true);
  view.setUint32(table + 4, 3, true);
  view.setUint32(table + 8, 0x40, true);
  view.setUint32(table + 12, 1, true);
  view.setUint32(table + 16, 0x48, true);
  view.setUint32(table + 20, 1, true);
  for (let index = 0; index < 3; index++) {
    view.setInt16(start + 0x24 + index * 8, index * 100, true);
    view.setInt16(start + 0x24 + index * 8 + 2, index * 10, true);
  }
  view.setInt16(start + 0x48, 0x1000, true);
  view.setUint32(start + 0x50, 0x20000304, true);
  view.setUint32(start + 0x54, 0x00112233, true);
  view.setUint16(start + 0x58, 0, true);
  view.setUint16(start + 0x5a, 0, true);
  view.setUint16(start + 0x5c, 1, true);
  view.setUint16(start + 0x5e, 2, true);
  return bytes;
}

function directContainerBytes(): Uint8Array {
  const bytes = modelBytes();
  const container = new Uint8Array(bytes.length + 12);
  new DataView(container.buffer).setUint32(0, 12, true);
  container.set(bytes, 12);
  return container;
}

describe('decodeModel', () => {
  it('accepts extended TmdWithId IDs inside effect containers', () => {
    const bytes = modelBytes(true);
    new DataView(bytes.buffer).setUint32(12, 0x10041, true);
    expect(decodeModel(bytes).parts[0].primitives).toHaveLength(1);
  });
  it('decodes an untextured lit TMD polygon', () => {
    const model = decodeModel(modelBytes());
    expect(model.format).toBe('TMD');
    expect(model.parts[0].vertices).toEqual([[0, 0, 0], [100, 10, 0], [200, 20, 0]]);
    expect(model.parts[0].primitives[0]).toMatchObject({
      indices: [0, 1, 2], normalIndices: [0, 0, 0], colors: [[51, 34, 17], [51, 34, 17], [51, 34, 17]],
    });
  });

  it('follows the CContainer pointer to its TmdWithId', () => {
    const model = decodeModel(modelBytes(true));
    expect(model.format).toBe('CContainer');
    expect(model.parts[0].primitives).toHaveLength(1);
  });

  it('accepts extracted CContainers whose pointer targets the TMD directly', () => {
    expect(decodeModel(directContainerBytes()).format).toBe('CContainer');
  });

  it('rejects CTMD that has not been transformed by SC', () => {
  const bytes = modelBytes();
  new DataView(bytes.buffer).setUint32(0, 0x2, true);
    expect(() => decodeModel(bytes)).toThrow('Compressed CTMD');
  });
});
