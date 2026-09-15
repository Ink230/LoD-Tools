# Effect preview runtime

The viewer executes the selected LMB allocation site and its child scripts in an isolated, bounded runtime. It does not boot a battle or fabricate actor/game-variable values. Unknown battle values can be copied through storage; consuming one for control flow or effect state stops that script with its address and reason.

## Data flow

1. `ExportEffectScripts.java` uses SC's script-recompiler and `patches/meta` to produce instruction addresses, entry points, allocation sites and script hashes
2. `build-catalog.mjs` records that structure and the DEFF resource directory. No script instructions, textures or model payloads are published
3. On selection, the browser reads the local script, checks its hash, executes it and loads only resources referenced by the resulting timeline
4. `asset-effect-scene.ts` translates the timeline to the existing stage's model/animation representation, including billboard sprites and per-frame colour/visibility

The preview controls select the allocation site, deterministic random seed, runtime versus raw tracks, playback tick and FPS. Restart reconstructs the same timeline for the same seed. Scrubbing uses recorded states rather than executing scripts backwards.

## Supported behavior

- Integer storage, inline values, arithmetic/bitwise operations, comparisons, jumps, loops, subroutines and returns
- Yield, rewind, mutable wait counters, bounded seeded random choices and effect deallocation
- Effect allocation, child-script startup, LMB slot binding, isolated position/rotation/scale/colour, colour tweens, visibility and translucency
- LMB model pieces and DEFF billboard sprites through the same resource resolver
- Explicit stops for unknown opcodes/functions, unsupported parameter addressing or missing battle state

The runtime has limits of 100,000 total instructions, 2,048 instructions per script per tick, 32 active scripts, 256 allocated effects, a 32-level call stack, and 300 preview ticks. Scene loading is limited to 64 files, 32 MiB and 1024 render parts. Script bytes are capped at 4 MiB. Metadata hashes prevent executing a modified script against stale instruction boundaries.

The stage uses unlit materials. Battle actors, damage, audio, controller rumble and the opening screen-distortion pass are not simulated. Gravity Grabber's main visual sequence is supported through shared effect operations; unsupported operations in other effects still report their address and reason.

## Rebuilding and checking

Run from `web` with a built SC checkout available. The exporter uses Java and the script-tool/dependency jars in SC's `build/libs/libs` directory.

```powershell
rtk proxy node tools/asset-viewer/build-catalog.mjs D:/java/sc/files
rtk proxy node tools/asset-viewer/verify-effect-runtime.mjs D:/java/sc/files
rtk npm test -- --watch=false --include=src/app/components/asset-viewer/*.spec.ts
rtk npm run build
```

The real-file check verifies Selebus's singing effect (`5312/0/0`): a child script selects a musical-note model, binds it to three LMB parts, fades in, waits, fades out and deallocates over 62 ticks. Unit tests cover branching, waits, seed determinism, resource caching, sprite metrics, unknown inputs and execution limits.

## Gravity Grabber component setup

The selected `4414/0/0` LMB is a 15-tick component of the spell. A reviewed context in `asset-effect-context.ts` binds its setup boundary and caller input to the exact script SHA256. Player/enemy selection supplies storage 9 (1/0); the original script performs its table lookup, position, scale, model binding, blending and lifespan setup. Execution stops at `0x2ae4`, before returning to unrelated surrounding spell operations; effect attachments continue until deallocation. No script operands or animation transforms are replaced by the context.

Generic attachment 585 uses SC's signed 24.8 accumulator, speed and acceleration. Replacing an attachment resets the accumulator from the current parameter and replaces the old speed. LMB allocation starts at -1 with speed 0x100; this phase replaces it with 0x200, producing animation ticks 1, 3, 5 and so on. The final preview frame has no live effects. The player and enemy integration checks each require 54 render parts, 15 frames, the script's position and scale, changing finite transforms, and zero diagnostics.

## Gravity Grabber spell composition

The default Spell composition option starts at `0x2618` and ends before gameplay/damage resolution at `0x37e0`. It executes 220 ticks and includes the animated TMD body (607), both LMBs, moving/scaling pillars, model-part-attached sprite trails (622), sphere-particle emitters (746, behaviour 46), camera child scripts (33/34), additive flash colours and final cleanup. The same composition is available from either of the package's LMB records. Selected LMB and raw animation tracks remain separate inspection modes.

The reviewed context supplies the player/enemy side, omits the earlier battle-stage manager (storage 10 = -1), and excludes the child script at `0x38a0` that moves battle actors. It does not rewrite effect instructions, geometry or animation. Audio, rumble, stage depth and PS1 depth-offset calls have no host side effects. Geometry, camera motion, attachment lifetimes and screen-flash colours are replayed from the original script. The opening screen distortion and battle actors are not reproduced; particle random variation is deterministic for a preview seed rather than reproducing an existing battle's RNG state. Preview lighting remains unlit.

The scene resolver uses the common HUD DEFF sprite metrics for slots 3 and 38 from `4114/2/17` and `4114/2/34`, and the viewer loads the common TIMs from `4114/3` before applying the spell's own textures. All payloads remain in the selected local files folder. Common textures are bounded to 40 known files and reset when the selected asset changes.

Type-2 LMB playback shares SC's 0x300-byte transform scratch buffer between effect managers. Gravity Grabber's second LMB consumes 65 nibbles after writing 64; the remaining value comes from the previous component. A standalone track starts with zero-filled scratch, while spell composition preserves the actual playback order. File bounds and scratch capacity remain checked.

Real-file verification requires both battle-side branches to complete 220 ticks without diagnostics, bind the animated body, pillars, both LMBs and global sprites, produce live trails and particles, emit camera/flash frames, replay deterministically, use finite transforms and clear all effects at completion. It retains the earlier 15-tick shard-phase and 62-tick Selebus regressions. Browser verification covers early effects, pillars, debris bursts, the game-camera toggle and scrubbing.