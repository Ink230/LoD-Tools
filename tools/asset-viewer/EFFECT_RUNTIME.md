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

The runtime has limits of 100,000 total instructions, 2,048 instructions per script per tick, 32 script states, 64 allocated effects, a 32-level call stack, and 300 preview ticks. Scene loading is limited to 64 files, 32 MiB and 256 render parts. Script bytes are capped at 4 MiB. Metadata hashes prevent executing a modified script against stale instruction boundaries.

This is an effect preview, not an SC emulator. Battle actors, camera scripts, Java-only bespoke effects, audio, most attachments, global resource slots and arbitrary script parameter modes remain unsupported. The stage uses its existing unlit materials. Notes distinguish these stops from resource decoding errors; partial supported geometry can still be inspected.

## Rebuilding and checking

Run from `web` with a built SC checkout available. The exporter uses Java and the script-tool/dependency jars in SC's `build/libs/libs` directory.

```powershell
rtk proxy node tools/asset-viewer/build-catalog.mjs D:/java/sc/files
rtk proxy node tools/asset-viewer/verify-effect-runtime.mjs D:/java/sc/files
rtk npm test -- --watch=false --include=src/app/components/asset-viewer/*.spec.ts
rtk npm run build
```

The real-file check verifies Selebus's singing effect (`5312/0/0`): a child script selects a musical-note model, binds it to three LMB parts, fades in, waits, fades out and deallocates over 62 ticks. Unit tests cover branching, waits, seed determinism, resource caching, sprite metrics, unknown inputs and execution limits.

Gravity Grabber (4414/0/0) additionally verifies extended TMD IDs, LMB type-2 rotation selection, translucency source selection, and 54 bound parts with changing finite transforms over 300 ticks. Its setup requires caller storage 9 at 0x2a78; this remains explicitly unresolved. Bound tracks continue after the script stops, labelled as partial playback, without inventing battle placement or executing later setup.
