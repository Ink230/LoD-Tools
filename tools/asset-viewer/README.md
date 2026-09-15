# Asset Viewer

The viewer uses a metadata catalog for **By format** and **By game asset**, with a secondary local file explorer. Connecting SC's extracted `files` directory grants read access; selecting a resource reads its payload and bounded companion resources. Catalog browsing does not load game payloads. Individual files can also be opened and model/texture/animation companions attached manually.

## Supported previews

| Resource | Preview |
| --- | --- |
| PNG / Opus | Browser image / audio playback |
| TIM | 4/8/16/24-bit images, CLUT selection, PSX transparency |
| MCQ | Reconstructed tiled image |
| TMD / TmdWithId / CContainer | Static parts, vertex colors, TIM texture pages, orbit, fit, wireframe |
| SPU sound bank | Individual ADPCM samples decoded to WAV; selectable sample rate |
| Standard animation / CMB / LMB 0–2 | Isolated part transforms, playback, frame scrub, companion model |
| ANM | Sprite sequence with TIM companions |
| CLUT instructions | Timed palette-row copies with a supplied TIM; instruction records |
| Environment / collision | Camera helper, collision geometry, and parsed records |

Standard animations display stored keyframes at 15 Hz to preserve their duration; SC's interpolated intermediate poses are not reproduced. LMB subtype comes from its DEFF container or manual selection. Model-independent animations require a compatible model. Environment previews show data and geometry, not assembled backgrounds. SPU playback rate is user selected because instrument/pitch context lives outside the sample bank. Browser Opus support depends on the browser.

Full scripted effects, complete scene reconstruction, music synthesis, IKI/video decoding, and editing are outside this implementation. Textures in bespoke effect packages are not assumed to be standalone TIMs. PSX blending is approximated through WebGL passes and is not a pixel-exact emulation of the console renderer.

## Extraction and patching

SC's `Unpacker` produces extracted/converted resources and its loading pipeline consumes them. Extraction is not a fresh ISO rebuild on every resource selection. This viewer reads the existing output; it does not run SC's unpacker, Java code, script patch/compiler pipeline, or mod runtime. It reconstructs the representations needed for a selected preview. Use an extraction matching the catalog; missing or changed resources report a load error. Runtime-driven effects and mod-specific behavior are not inferred from raw files.

## Generate and validate

Run from `web` with a modern Node version supporting native TypeScript stripping:

```powershell
rtk proxy node tools/asset-viewer/build-catalog.mjs D:/java/sc/files
rtk proxy node tools/asset-viewer/verify-assets.mjs D:/java/sc/files
rtk npm test -- --watch=false --include=src/app/components/asset-viewer/*.spec.ts
rtk proxy npx eslint src/app/components/asset-viewer
rtk npm run build
```

The generator writes only compressed JSON metadata to `src/assets/asset-viewer/catalog.json.gz`; no game payloads are copied. It detects DEFF offsets, archive companions, submap model/animation groups, and optional names from `LodDeffs.java`. The verifier samples up to 12 records per custom format; it is not an exhaustive check of every asset or runtime behavior.

Limits: 128 MiB per selected resource; 32 companion textures totaling 32 MiB; at most 256 decoded texture pages. Directory handles are cached and archive `mrg` aliases are resolved on demand. Object URLs, rendering resources, observers, and playback callbacks are released when replaced or destroyed.

## Source authority

Implementation follows SC's `Tim`, `McqBuilder`, `McqHeader`, `Tmd`, `TmdObjLoader`, `CContainer`, `TmdAnimationFile`, `Cmb`, `LmbType0/1/2`, `Models.animateModelClut`, `SMap` ANM rendering, `MapIndicator`, `RetailSubmap`, `Graphics`, `SoundBankEntry`, `DeffPart`, `LodDeffs`, `Unpacker`, and `Loader` Java implementations.

## Validation evidence

Verified against local extracted assets: 12 samples each for TIM, MCQ, TMD, standard animation, CMB, LMB, CLUT, SPU, environment and collision; all 3 ANM resources. Browser integration with actual bytes behind a test directory handle confirmed font TIM 256×56, Game Over MCQ 640×240, PNG object URL, Dart's 17-part model with 11 texture pages and 10 keyframes, 22 combat sound samples, and a submap overlay with 53 polygons and 57 records. The mocked picker does not validate native OS folder-picker behavior. Audio listening and full visual accuracy across all assets are not covered by these checks.
