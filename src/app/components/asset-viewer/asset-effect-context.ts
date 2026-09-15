import { EffectPreviewContext, EffectRuntimeMetadata } from './asset-effect-runtime';

export type EffectBattleSide = 'player' | 'enemy';
export interface EffectSetupContext extends EffectPreviewContext { label: string; }

/** Reviewed caller inputs and component boundaries, never replacement script
 * instructions. Addresses are bound to the exact script-tool input hash. */
export function effectSetupContext(metadata: EffectRuntimeMetadata, start: number, side: EffectBattleSide, scope: 'phase' | 'spell' = 'phase'): EffectSetupContext | undefined {
  if (metadata.script !== 'SECT/DRGN0.BIN/4414/1' || metadata.program.sha256 !== '714a75c1baa960a4a81209075b51a7706acda803f293b45d1f8c22535fd37155') return undefined;
  if (!((metadata.flags === 0x34e00 && start === 0x2a30) || (metadata.flags === 0x34f00 && start === 0x2d40))) return undefined;
  if (scope === 'spell') return { storage: { 9: side === 'player' ? 1 : 0, 10: -1 }, start: 0x2618, stopBefore: 0x37e0, scene: true, actorScripts: [0x38a0], label: 'Gravity Grabber · Spell composition' };
  if (metadata.flags !== 0x34e00) return undefined;
  // Entry point tests the attacker against playerBents (vars 34/35), then
  // stores 1 for a player and 0 for an enemy. The script supplies positions.
  // 0x2ae4 resumes the surrounding spell after this LMB's lifespan is installed.
  return { storage: { 9: side === 'player' ? 1 : 0 }, stopBefore: 0x2ae4, label: 'Gravity Grabber · LMB phase' };
}
