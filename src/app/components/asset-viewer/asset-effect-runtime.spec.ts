import { describe, expect, it } from 'vitest';
import { EffectPreviewRuntime, EffectProgram, EffectPreviewContext } from './asset-effect-runtime';

const literal = (n: number) => [0x01000000, n];
const stor = (n: number) => [0x02000000 | n];
function script() {
  const words: number[] = [], offsets: number[] = [];
  const op = (code: number, params: number[][] = [], header = 0) => {
    offsets.push(words.length * 4); words.push((header << 16) | (params.length << 8) | code, ...params.flat());
    return offsets.at(-1)!;
  };
  const run = (frames = 300, seed = 1, context: EffectPreviewContext = {}) => {
    const data = new Uint8Array(words.length * 4), view = new DataView(data.buffer);
    words.forEach((n, i) => view.setUint32(i * 4, n >>> 0, true));
    const program: EffectProgram = { offsets, starts: {}, entrypoints: [0], sha256: '' };
    return new EffectPreviewRuntime(data, program, 0, seed, context).run(frames);
  };
  return { words, offsets, op, run };
}
describe('effect preview runtime', () => {
  it('rotates relative positions through the parent and applies scale tweens', () => {
    const s = script();
    s.op(56, [stor(18)], 600);
    s.op(56, [stor(18), literal(-1), literal(100), literal(0), literal(0)], 545);
    s.op(56, [stor(18), literal(-1), literal(0), literal(1024), literal(0)], 547);
    s.op(56, [stor(19), literal(1)], 606);
    s.op(56, [stor(19), stor(18), literal(0), literal(0), literal(20)], 545);
    s.op(56, [stor(19), literal(-1), literal(2), literal(8192), literal(12288), literal(16384)], 576);
    s.op(73);
    const result = s.run(2);
    expect(result.frames[0].effects[1].position[0]).toBeCloseTo(120);
    expect(result.frames[0].effects[1].position[2]).toBeCloseTo(0);
    expect(result.frames[1].effects[1].scale).toEqual([2, 3, 4]);
  });
  it('uses caller context and stops component setup before unrelated spell instructions', () => {
    const s = script();
    s.op(56, [stor(18), literal(0x34e00)], 605);
    s.op(56, [stor(18), literal(-1), stor(9), literal(0), literal(0)], 545);
    s.op(56, [stor(18), literal(0), literal(256), literal(0)], 585);
    s.op(56, [stor(18), literal(0), literal(512), literal(0)], 585);
    s.op(56, [stor(18), literal(3)], 588);
    const stopBefore = s.op(56, [], 999);
    const result = s.run(20, 1, { storage: { 9: -3840 }, stopBefore });
    expect(result.diagnostics).toEqual([]);
    expect(result.frames.map(frame => frame.effects[0]?.age)).toEqual([1, 3, undefined]);
    expect(result.frames[0].effects[0].position).toEqual([-3840, 0, 0]);
  });
  it('accumulates fractional animation speed and acceleration without an extra automatic tick', () => {
    const s = script();
    s.op(56, [stor(18), literal(1)], 605);
    s.op(56, [stor(18), literal(0), literal(0)], 553);
    s.op(56, [stor(18), literal(0), literal(0), literal(128)], 585);
    s.op(73);
    expect(s.run(4).frames.map(frame => frame.effects[0].age)).toEqual([0, 1, 3, 5]);
  });
  it('keeps bound LMB tracks playing when setup needs unavailable battle context', () => {
    const s = script();
    s.op(56, [stor(18), literal(0x34e00)], 605);
    s.op(56, [stor(18), literal(2), literal(1)], 553);
    s.op(56, [stor(18), literal(0)], 590);
    s.op(56, [stor(18), literal(-1), stor(9), literal(0), literal(0)], 545);
    const result = s.run(4);
    expect(result.diagnostics[0]).toContain('initial stor[9]');
    expect(result.frames.map(frame => frame.effects[0].age)).toEqual([0, 1, 2, 3]);
    expect(result.frames[3].effects[0].animateRotation).toBe(true);
    expect(result.frames[3].effects[0].useEffectTranslucency).toBe(false);
  });
  it('executes storage, loops, waits and resource changes over separate ticks', () => {
    const s = script();
    s.op(56, [stor(18), literal(0x25c00)], 605);
    s.op(8, [literal(3), stor(8)]);
    const loop = s.op(56, [stor(18), literal(0), stor(8)], 608);
    s.op(0);
    const branch = s.words.length * 4;
    s.op(67, [stor(8), [0x09000000 | (((loop - branch) / 4) & 0xffff)]]);
    s.op(56, [stor(18), literal(0)], 589);
    s.op(73);
    const result = s.run(4);
    expect(result.frames.map(f => f.effects[0].slots[0])).toEqual([3, 2, 1, 1]);
    expect(result.frames[3].effects[0].visible).toBe(false);
  });
  it('runs a child with its own storage, gosub stack and colour tween', () => {
    const s = script();
    s.op(56, [stor(18), literal(0x25c00)], 605);
    const fork = s.op(56, [stor(18), [0]], 618);
    s.op(73);
    const child = s.words.length * 4;
    s.words[fork / 4 + 2] = 0x09000000 | ((child - fork) / 4);
    s.op(56, [stor(17), literal(0x3000010)], 606);
    s.op(56, [stor(0), literal(-1), literal(0), literal(0), literal(0)], 551);
    const call = s.op(72, [[0]]);
    s.op(56, [stor(0), literal(-1), literal(2), literal(128), literal(128), literal(128)], 581);
    s.op(8, [literal(2), stor(23)]);
    s.op(2, [stor(23)]);
    s.op(80);
    const helper = s.words.length * 4;
    s.words[call / 4 + 1] = 0x09000000 | ((helper - call) / 4);
    s.op(56, [stor(0), literal(0), literal(0x3025c01)], 608);
    s.op(73);
    const result = s.run();
    expect(result.diagnostics).toEqual([]);
    expect(result.frames[1].effects[0].slots[0]).toBe(0x3025c01);
    expect(result.frames[1].effects).toHaveLength(2);
    expect(result.frames[1].effects[0].colour).toEqual([64, 64, 64]);
    expect(result.frames[2].effects[0].colour).toEqual([128, 128, 128]);
    expect(result.frames.at(-1)!.effects).toEqual([]);
  });
  it('propagates unknown battle values until consumed instead of replacing them with zero', () => {
    const s = script();
    s.op(8, [[0x0f008d2d], stor(20)]);
    s.op(24, [literal(1), stor(20)]);
    s.op(65, [stor(20), literal(0), [0x09000000]], 2);
    const result = s.run();
    expect(result.diagnostics[0]).toContain('Needs battle input');
    expect(result.instructions).toBe(3);
  });
  it('stops unknown host calls and loops at a bounded instruction budget', () => {
    const unknown = script(); unknown.op(56, [], 999);
    expect(unknown.run().diagnostics[0]).toContain('Unsupported effect function 999');
    const loop = script(); loop.op(64, [[0x09000000]]);
    expect(loop.run().diagnostics[0]).toContain('instruction budget');
  });
  it('replays seeded random choices deterministically', () => {
    const s = script();
    s.op(56, [stor(18), literal(1)], 605);
    s.op(49, [literal(100000), stor(8)]);
    s.op(56, [stor(18), literal(0), stor(8)], 608);
    s.op(73);
    expect(s.run(1, 42).frames).toEqual(s.run(1, 42).frames);
    expect(s.run(1, 42).frames).not.toEqual(s.run(1, 43).frames);
  });
});
