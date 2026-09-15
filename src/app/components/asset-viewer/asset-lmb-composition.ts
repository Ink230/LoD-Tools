import { AssetBinary } from './asset-binary';

export interface LmbSetup { slots: Record<number, number[]>; scriptOffset: number; }
interface Param { value?: number; storage?: number; address?: number; }
interface Instruction { code: number; call: number; params: Param[]; next: number; }

function instruction(data: AssetBinary, offset: number): Instruction {
  const word = data.u32(offset), count = (word >>> 8) & 255;
  if (count > 10) throw new Error('Invalid script parameter count');
  let next = offset + 4;
  const params: Param[] = [];
  for (let i = 0; i < count; i++) {
    const raw = data.u32(next), type = raw >>> 24;
    next += 4;
    if (type === 1) { params.push({ value: data.u32(next) }); next += 4; }
    else if (type === 2) params.push({ storage: raw & 255 });
    else if (type === 9) params.push({ address: offset + ((raw << 16) >> 16) * 4 });
    else if (type >= 3 && type <= 0x27) {
      params.push({});
      if ([0x13, 0x14, 0x15, 0x16, 0x17, 0x24, 0x25, 0x26, 0x27].includes(type)) next += 4;
      if (type === 0x21) next += Math.ceil(((raw >>> 16) & 255) / 4) * 4;
    } else params.push({ value: raw });
  }
  data.check(offset, next - offset);
  return { code: word & 255, call: word >>> 16, params, next };
}

/** Resolves bounded, straight-line LMB setup, not arbitrary battle script execution.
 * Battle function 605 allocates, 618 starts its child script, 608 assigns a slot.
 * Unknown values and conditional control flow are deliberately not guessed.
 */
export function resolveLmbSetups(bytes: Uint8Array, lmbFlags: number): LmbSetup[] {
  const data = new AssetBinary(bytes), setups: LmbSetup[] = [];
  for (let offset = 0; offset + 4 <= bytes.length; offset += 4) {
    if (data.u32(offset) !== ((605 << 16) | (2 << 8) | 56)) continue;
    try {
      const allocate = instruction(data, offset);
      if (allocate.params[1].value !== lmbFlags || allocate.params[0].storage === undefined) continue;
      let cursor = allocate.next;
      let effectStorage = allocate.params[0].storage;
      const fork = instruction(data, cursor);
      if (fork.code === 56 && fork.call === 618 && fork.params[0]?.storage === effectStorage && fork.params[1]?.address !== undefined) {
        cursor = fork.params[1].address;
        effectStorage = 0;
      }
      const values = new Map<number, number[]>(), slots: Record<number, number[]> = {};
      const read = (p?: Param): number[] | undefined => p?.value !== undefined ? [p.value] : p?.storage !== undefined ? values.get(p.storage) : undefined;
      const visited = new Set<number>();
      for (let steps = 0; steps < 256 && !visited.has(cursor); steps++) {
        visited.add(cursor);
        const op = instruction(data, cursor), p = op.params;
        cursor = op.next;
        if (op.code === 8 || op.code === 49 || op.code === 24) {
          if (p[1]?.storage === undefined) continue;
          const source = read(p[0]);
          let result: number[] | undefined;
          if (op.code === 8) result = source;
          if (op.code === 49 && source?.length === 1 && source[0] > 0 && source[0] <= 32) result = Array.from({ length: source[0] }, (_, i) => i);
          if (op.code === 24 && source?.length === 1) result = read(p[1])?.map(value => (value + source[0]) >>> 0);
          if (result) values.set(p[1].storage, result);
          else values.delete(p[1].storage);
        } else if (op.code === 56 && op.call === 608) {
          if (p[0]?.storage !== effectStorage) continue;
          const slot = read(p[1]), flags = read(p[2]);
          if (slot?.length === 1 && slot[0] < 8 && flags?.length) slots[slot[0]] = flags;
        } else if (op.code === 72) {
          // A helper can mutate storage. Only subsequent assignments remain known.
          values.clear();
        } else if (op.code === 56) {
          // Whitelisted setup calls do not write script storage. Other calls end analysis.
          if (![545, 547, 549, 551, 553, 555, 562, 564, 565].includes(op.call)) break;
        } else break;
      }
      if (Object.keys(slots).length) setups.push({ slots, scriptOffset: offset });
    } catch { /* Not a resolvable setup; keep the animation-only fallback. */ }
  }
  return setups;
}

export function lmbPartSlots(bytes: Uint8Array, type: number): number[] {
  const data = new AssetBinary(bytes), count = data.u32(4);
  if (count > 1024) throw new Error('LMB part count exceeds preview limit');
  if (type === 0) return Array.from({ length: count }, (_, i) => data.u16(8 + i * 12));
  const table = data.u32(12);
  return Array.from({ length: count }, (_, i) => data.u8(table + i * 4 + 3));
}
