import { describe, expect, it } from 'vitest';
import { effectSetupContext } from './asset-effect-context';
import { EffectRuntimeMetadata } from './asset-effect-runtime';

describe('effect setup context', () => {
  const metadata: EffectRuntimeMetadata = {
    script: 'SECT/DRGN0.BIN/4414/1', flags: 0x34e00, resources: [],
    program: { offsets: [], starts: {}, entrypoints: [], sha256: '714a75c1baa960a4a81209075b51a7706acda803f293b45d1f8c22535fd37155' },
  };
  it('supplies the reviewed player/enemy branch input', () => {
    expect(effectSetupContext(metadata, 0x2a30, 'player')?.storage).toEqual({ 9: 1 });
    expect(effectSetupContext(metadata, 0x2a30, 'enemy')?.storage).toEqual({ 9: 0 });
  });
  it('opens the full visual sequence from either LMB without starting at the shards', () => {
    expect(effectSetupContext(metadata, 0x2a30, 'player', 'spell')).toMatchObject({ start: 0x2618, stopBefore: 0x37e0, scene: true });
    expect(effectSetupContext({ ...metadata, flags: 0x34f00 }, 0x2d40, 'enemy', 'spell')?.storage?.[9]).toBe(0);
  });
  it('refuses stale addresses or another component', () => {
    expect(effectSetupContext({ ...metadata, program: { ...metadata.program, sha256: 'changed' } }, 0x2a30, 'player')).toBeUndefined();
    expect(effectSetupContext(metadata, 0x2b00, 'player')).toBeUndefined();
    expect(effectSetupContext({ ...metadata, flags: 0x34f00 }, 0x2a30, 'player')).toBeUndefined();
  });
});
