import { AssetBinary } from './asset-binary';
import { Vec3 } from './asset-preview-types';

export interface EffectProgram { offsets: number[]; starts: Record<string, number[]>; entrypoints: number[]; sha256: string; }
export interface EffectResource { path: string; flags: number; offset: number; kind: 'LMB' | 'TMD' | 'Sprite'; lmbType?: number; }
export interface EffectRuntimeMetadata { script: string; flags: number; program: EffectProgram; resources: EffectResource[]; }
type Value = number | { missing: string };
interface Ref { get(): Value; set(value: Value): void; address?: number; }
interface Thread { id: number; pc: number; storage: Value[]; stack: number[]; alive: boolean; }
interface Tween { field: 'position' | 'rotation' | 'scale' | 'colour'; start: Vec3; target: Vec3; elapsed: number; ticks: number; }
export interface PreviewEffect {
  id: number; kind: 'LMB' | 'TMD' | 'Sprite' | 'Empty'; flags: number; slots: number[];
  position: Vec3; rotation: Vec3; scale: Vec3; colour: Vec3;
  age: number; parent: number; visible: boolean; translucency: number; applyRotationScale: boolean; animateRotation?: boolean; useEffectTranslucency?: boolean;
}
interface LiveEffect extends PreviewEffect { tweens: Tween[]; lifespan?: number; }
export interface EffectRuntimeFrame { effects: PreviewEffect[]; }
export interface EffectRuntimeResult { frames: EffectRuntimeFrame[]; diagnostics: string[]; instructions: number; }

/** Isolated integer script VM. No filesystem, DOM, or game writes. Unknown battle
 * inputs propagate through storage and stop execution only when actually consumed.
 * Instruction addresses are supplied by SC's script-recompiler, not byte scanning.
 */
export class EffectPreviewRuntime {
  private readonly data: AssetBinary;
  private readonly addresses: Set<number>;
  private readonly threads = new Map<number, Thread>();
  private readonly effects = new Map<number, LiveEffect>();
  private readonly owners = new Map<number, number>();
  private nextId = 1;
  private random: number;
  private executed = 0;
  private diagnostics: string[] = [];
  constructor(bytes: Uint8Array, private readonly program: EffectProgram, start: number, seed = 1) {
    this.data = new AssetBinary(new Uint8Array(bytes));
    this.addresses = new Set(program.offsets);
    this.random = seed >>> 0;
    this.threads.set(0, this.thread(0, start));
  }
  private thread(id: number, pc: number): Thread {
    const storage: Value[] = Array.from({ length: 33 }, (_, index) => ({ missing: `initial stor[${index}]` }));
    storage[0] = id;
    return { id, pc, storage, stack: [], alive: true };
  }
  private number(value: Value): number {
    if (typeof value !== 'number') throw new Error(`Needs battle input: ${value.missing}`);
    return value | 0;
  }
  private memory(address: number): Ref {
    this.data.check(address, 4);
    return { address, get: () => this.data.i32(address), set: value => new DataView(this.data.bytes.buffer).setInt32(address, this.number(value), true) };
  }
  private storage(thread: Thread, index: number): Ref {
    if (index < 0 || index >= 33) throw new Error(`Storage index ${index} is out of bounds`);
    return { get: () => thread.storage[index], set: value => thread.storage[index] = value };
  }
  private missing(name: string): Ref { return { get: () => ({ missing: name }), set: () => { throw new Error(`Cannot write battle input: ${name}`); } }; }
  private params(thread: Thread, start: number, count: number): Ref[] {
    const refs: Ref[] = [];
    for (let i = 0; i < count; i++) {
      const address = thread.pc, raw = this.data.u32(address), type = raw >>> 24;
      const a = raw & 255, b = (raw >>> 8) & 255, c = (raw >>> 16) & 255, relative = (raw << 16) >> 16;
      thread.pc += 4;
      const stor = (index: number) => this.number(this.storage(thread, index).get());
      const mem = (word: number) => this.memory(start + word * 4);
      if (type === 1) { refs.push(this.memory(thread.pc)); thread.pc += 4; }
      else if (type === 2) refs.push(this.storage(thread, a));
      else if (type === 9) refs.push(mem(relative));
      else if (type === 10) refs.push(mem(relative + stor(c)));
      else if (type === 11) refs.push(mem(relative + this.number(mem(relative + stor(c)).get())));
      else if (type === 0x13) refs.push(mem(relative + c));
      else if (type === 0x14) refs.push(mem(relative + this.number(mem(relative + c).get())));
      else if (type === 4 || type === 0xd) {
        const other = this.threads.get(stor(a));
        refs.push(other ? this.storage(other, b + (type === 4 ? stor(c) : c)) : this.missing('external script storage'));
      } else if ([5, 6, 7, 8, 0xe, 0xf, 0x10, 0x11].includes(type)) refs.push(this.missing(`game variable parameter 0x${raw.toString(16)}`));
      else if (type >= 3 && type <= 0x27) throw new Error(`Unsupported script parameter type 0x${type.toString(16)}`);
      else refs.push(this.memory(address));
    }
    return refs;
  }
  private compare(a: number, b: number, mode: number): boolean {
    switch (mode) {
      case 0: return a <= b; case 1: return a < b; case 2: return a === b; case 3: return a !== b;
      case 4: return a > b; case 5: return a >= b; case 6: return !!(a & b); case 7: return !(a & b);
      case 8: return !!a && !!b; case 9: return !!a || !!b;
      default: throw new Error(`Unknown comparison ${mode}`);
    }
  }
  private allocate(kind: LiveEffect['kind'], flags: number, owner: number): number {
    if (this.nextId > 64) throw new Error('Effect allocation limit (64) reached');
    const id = this.nextId++;
    this.owners.set(id, owner);
    this.effects.set(id, { id, kind, flags: flags >>> 0, slots: Array(8).fill(0), position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], colour: [128, 128, 128], age: 0, parent: -1, visible: true, applyRotationScale: true, translucency: 1, tweens: [] });
    return id;
  }
  private deallocate(id: number): void {
    for (const [child, owner] of this.owners) if (owner === id) this.deallocate(child);
    this.owners.delete(id);
    this.effects.delete(id);
    const thread = this.threads.get(id);
    if (thread) thread.alive = false;
  }
  private host(thread: Thread, call: number, p: Ref[]): void {
    const n = (i: number) => this.number(p[i].get());
    const effect = () => {
      const value = this.effects.get(n(0));
      if (!value) throw new Error(`Effect ${n(0)} is not present in this preview`);
      return value;
    };
    if ([600, 601, 605, 606].includes(call)) {
      const kind = call === 600 ? 'Empty' : call === 601 ? 'Sprite' : call === 605 ? 'LMB' : 'TMD';
      const flags = call === 600 ? 0 : n(1) | (call === 601 ? 0x4000000 : call === 606 ? 0x3000000 : 0);
      p[0].set(this.allocate(kind, flags, thread.id));
    } else if (call === 618) {
      const id = n(0);
      if (!this.effects.has(id) || this.threads.size >= 32) throw new Error('Invalid child effect or script limit reached');
      if (p[1].address === undefined) throw new Error('Child script requires an inline address');
      this.threads.set(id, this.thread(id, p[1].address));
    } else if (call === 608) {
      const slot = n(1);
      if (slot < 0 || slot > 7) throw new Error('LMB slot is outside 0–7');
      effect().slots[slot] = n(2) >>> 0;
    } else if ([545, 547, 549, 551].includes(call)) {
      const field = call === 545 ? 'position' : call === 547 ? 'rotation' : call === 549 ? 'scale' : 'colour';
      if (n(1) !== -1) throw new Error(`Relative ${field} needs a battle parent`);
      effect()[field] = [2, 3, 4].map(i => call === 549 ? ((n(i) << 16) >> 16) / 4096 : call === 547 ? n(i) * Math.PI / 2048 : call === 551 ? n(i) & 0xffff : n(i)) as Vec3;
    } else if ([558, 567, 575, 580].includes(call)) {
      throw new Error(`Effect attachment ${call} is not supported yet`);
    } else if (call === 581) {
      if (n(1) !== -1) throw new Error('Colour tween needs a battle parent');
      const target = effect(), ticks = n(2);
      if (ticks > 0) {
        target.tweens = target.tweens.filter(tween => tween.field !== 'colour');
        target.tweens.push({ field: 'colour', start: [...target.colour], target: [n(3), n(4), n(5)], elapsed: 0, ticks });
      }
    } else if (call === 553) {
      if (n(1) === 0) effect().age = n(2);
      else if (n(1) === 2 && effect().kind === 'LMB') effect().animateRotation = n(2) !== 0;
      else throw new Error(`Unsupported effect parameter ${n(1)}`);
    } else if (call === 588) effect().lifespan = n(1);
    else if (call === 589) effect().visible = (n(1) & 1) !== 0;
    else if (call === 565) effect().applyRotationScale = n(1) !== 0;
    else if (call === 590) effect().useEffectTranslucency = n(1) !== 0;
    else if (call === 591) effect().translucency = n(1) & 3;
    else if (call === 611) {
      if (n(2) !== -1) throw new Error('Attaching to a model part needs battle state');
      effect().parent = n(1);
    } else if ([562, 572, 584, 595].includes(call)) {
      // No-op/lighting flags have no effect on the unlit isolated mesh preview.
    } else throw new Error(`Unsupported effect function ${call}`);
  }
  private execute(thread: Thread): void {
    for (let budget = 0; budget < 2048 && thread.alive; budget++) {
      const start = thread.pc;
      try {
        if (!this.addresses.has(start)) throw new Error('Address is not an instruction in script-tool metadata');
        const word = this.data.u32(start), code = word & 255, count = (word >>> 8) & 255, header = word >>> 16;
        if (count > 10) throw new Error('Script parameter count exceeds 10');
        thread.pc += 4;
        const p = this.params(thread, start, count), n = (i: number) => this.number(p[i].get());
        const jump = (i: number) => {
          if (p[i].address === undefined) throw new Error('Jump requires inline address');
          thread.pc = p[i].address!;
        };
        if (this.executed >= 100000) throw new Error('Total instruction budget (100000) exceeded');
        this.executed++;
        if (code === 0) return;
        if ([1, 5, 6, 7, 11, 13, 14, 15].includes(code)) { thread.pc = start; return; }
        if (code === 2) { if (n(0)) { p[0].set(n(0) - 1); thread.pc = start; return; } }
        else if (code === 3 || code === 4) { if (!this.compare(code === 3 ? n(0) : 0, n(code === 3 ? 1 : 0), header)) { thread.pc = start; return; } }
        else if (code === 8) p[1].set(p[0].get());
        else if (code === 12) p[0].set(0);
        else if (code === 56) this.host(thread, header, p);
        else if (code === 64) jump(0);
        else if (code === 65 || code === 66) { if (this.compare(code === 65 ? n(0) : 0, n(code === 65 ? 1 : 0), header)) jump(code === 65 ? 2 : 1); }
        else if (code === 67) { p[0].set(n(0) - 1); if (n(0)) jump(1); }
        else if (code === 72) { if (thread.stack.length >= 32) throw new Error('Call stack limit reached'); thread.stack.push(thread.pc); jump(0); }
        else if (code === 73) { const address = thread.stack.pop(); if (address === undefined) { thread.alive = false; return; } thread.pc = address; }
        else if (code === 80 || code === 82) { this.deallocate(thread.id); return; }
        else if (code === 83) this.deallocate(n(0));
        else if (code === 49) { const bound = n(0); this.random = (Math.imul(this.random, 1664525) + 1013904223) >>> 0; p[1].set(Math.floor(this.random / 0x100000000 * bound)); }
        else if ([16, 17, 18, 21, 22, 24, 25, 26, 32, 33, 34, 35, 36, 40, 41, 42].includes(code)) {
          const a = p[0].get(), b = p[1].get();
          if (typeof a !== 'number' || typeof b !== 'number') { p[1].set(typeof a !== 'number' ? a : b); continue; }
          let result: number;
          switch (code) {
            case 16: result = b & a; break; case 17: result = b | a; break; case 18: result = b ^ a; break;
            case 21: result = b << a; break; case 22: result = b >> a; break;
            case 24: result = b + a; break; case 25: result = b - a; break; case 26: result = a - b; break;
            case 32: result = Math.imul(b, a); break; case 40: result = Math.trunc(b * a / 4096); break;
            default: {
              const divisor = [34, 36, 42].includes(code) ? b : a, numerator = [34, 36, 42].includes(code) ? a : b;
              if (!divisor) throw new Error('Division by zero');
              result = [35, 36].includes(code) ? numerator % divisor : Math.trunc(numerator * ([41, 42].includes(code) ? 4096 : 1) / divisor);
            }
          }
          p[1].set(result | 0);
        } else if ([20, 27, 28, 29, 30].includes(code)) p[0].set(code === 20 ? ~n(0) : code === 27 ? n(0) + 1 : code === 28 ? n(0) - 1 : code === 29 ? -n(0) : Math.abs(n(0)));
        else if (code === 48 || code === 50 || code === 51) p[1].set(Math.trunc(code === 48 ? Math.sqrt(n(0)) : (code === 50 ? Math.sin(n(0) * Math.PI / 2048) : Math.cos(n(0) * Math.PI / 2048)) * 4096));
        else if (code !== 100) throw new Error(`Unsupported script opcode ${code}`);
      } catch (error) {
        this.diagnostics.push(`Script ${thread.id} at 0x${start.toString(16)}: ${error instanceof Error ? error.message : String(error)}`);
        thread.alive = false;
        return;
      }
    }
    if (thread.alive) { thread.alive = false; this.diagnostics.push(`Script ${thread.id}: instruction budget exceeded`); }
  }
  run(maxFrames = 300): EffectRuntimeResult {
    const frames: EffectRuntimeFrame[] = [];
    for (let tick = 0; tick < Math.min(900, maxFrames); tick++) {
      // A newly allocated child starts next tick, matching the script scheduler boundary.
      for (const thread of [...this.threads.values()]) if (thread.alive) this.execute(thread);
      for (const effect of this.effects.values()) {
        for (const tween of effect.tweens) {
          tween.elapsed++;
          const amount = Math.min(1, tween.elapsed / tween.ticks);
          effect[tween.field] = tween.start.map((value, i) => value + (tween.target[i] - value) * amount) as Vec3;
        }
        effect.tweens = effect.tweens.filter(tween => tween.elapsed < tween.ticks);
        if (effect.lifespan !== undefined && --effect.lifespan <= 0) this.deallocate(effect.id);
      }
      frames.push({ effects: [...this.effects.values()].map(effect => ({ id: effect.id, kind: effect.kind, flags: effect.flags, age: effect.age, parent: effect.parent, visible: effect.visible, translucency: effect.translucency, applyRotationScale: effect.applyRotationScale, animateRotation: effect.animateRotation, useEffectTranslucency: effect.useEffectTranslucency, slots: [...effect.slots], position: [...effect.position], rotation: [...effect.rotation], scale: [...effect.scale], colour: [...effect.colour] })) });
      for (const effect of this.effects.values()) effect.age++;
      // A blocked script must not freeze already-bound animation tracks. Keep
      // ticking those effects, with the missing setup reported in diagnostics.
      if (![...this.threads.values()].some(thread => thread.alive) && !this.effects.size) break;
    }
    if (frames.length === Math.min(900, maxFrames)) this.diagnostics.push(`Preview stopped at ${frames.length} ticks`);
    return { frames, diagnostics: this.diagnostics, instructions: this.executed };
  }
}
