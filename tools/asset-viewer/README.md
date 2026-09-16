# Asset Viewer

The viewer uses a metadata catalog for **By format** and **By game asset**, with a secondary local file explorer. Connecting SC's extracted `files` directory grants read access; selecting a resource reads its payload and bounded companion resources. Catalog browsing does not load game payloads. Individual files can also be imported into the viewer.

The **Choose textures**, **Choose model**, and **Choose animation** controls open the viewer's own searchable asset chooser. They select catalog references or previously imported files, preserving embedded offsets and LMB subtypes. Textures support ordered multiple selection. Cached thumbnails identify recently loaded resources (up to 256 thumbnails); opening or searching the chooser does not read payloads. Applying the selection uses the current SC folder connection or imported file reference, never a native companion file picker.

Each companion control lists its loaded asset names, including automatically resolved companions. Clicking a name opens that entity in the main viewer. Previous/next controls step through compatible catalog entries and wrap at the ends; texture stepping replaces the current texture set with one texture. The main preview header provides Back/Forward through successfully opened entities, including imported files. Opening a new entity after going back starts a new forward history.

The right-hand inspector's **Entity attachments** lists the selected source entity's linked textures, model, animations, and scene resources. These links remain tied to that entity's catalog metadata. The top **Preview composition** controls change only the current composite preview; they do not rewrite entity attachments, modify files, or save overrides. Reopening an entity rebuilds its preview from its source links.

Companion controls exclude generic game archives, submap archives, and field effects by default. **Include game resources** enables `SECT/` resources other than the submap archives; **Include submap resources** independently enables `SECT/DRGN21.BIN` through `DRGN24.BIN`. **Include field effects** independently enables the `SUBMAP/` field-effect resources. These switches apply to companion pickers, animation options, random selection, and previous/next selection. They do not unload existing companions or prevent automatic loading of an entity's known companions.

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

Standard and CMB animations display stored keyframes at 15 Hz to preserve their duration; SC's interpolated intermediate poses are not reproduced. LMB subtype comes from its DEFF container or manual selection. Model-independent animations require a compatible model. Environment previews show data and geometry, not assembled backgrounds. SPU playback rate is user selected because instrument/pitch context lives outside the sample bank. Browser Opus support depends on the browser.

Dragoon DEFF packages use SC's paired texture directories and optional extra TIM sets, in upload order. For example, `SECT/DRGN0.BIN/4154/0/0` contains a 29-part model at offset 40 and its 36-keyframe CMB at offset 28620; its 12 textures come from `SECT/DRGN0.BIN/4153`. This does not reproduce script-driven texture animation or mod overrides.

Full scripted effects, complete scene reconstruction, music synthesis, IKI/video decoding, and editing are outside this implementation. Textures in bespoke effect packages are not assumed to be standalone TIMs. PSX blending is approximated through WebGL passes and is not a pixel-exact emulation of the console renderer.

## Extraction and patching

SC's `Unpacker` produces extracted/converted resources and its loading pipeline consumes them. Extraction is not a fresh ISO rebuild on every resource selection. This viewer reads the existing output; it does not run SC's unpacker, Java code, script patch/compiler pipeline, or mod runtime. It reconstructs the representations needed for a selected preview. Use an extraction matching the catalog; missing or changed resources report a load error. Runtime-driven effects and mod-specific behavior are not inferred from raw files.

## Battle stages

**By Asset → Battle stages** groups the 96 retail stage package IDs (`SECT/DRGN0.BIN/2497` through `2592`) separately from generic game resources. Empty resources are omitted from the catalog; the current extraction contains 89 non-empty arena models.

Opening a stage TMD or its animation loads the package's arena (`0/0`), animation (`0/1`), TIM (`2`), and MCQ backdrop (`1`) on demand. Source references appear in the inspector, including on the individual TIM and MCQ entries. Selecting those images still opens their standalone image previews. The **Background** toggle changes only the current preview.

Composition follows `Battle.loadStage`, its initial +90-degree stage rotation, and `Battle.renderSkybox` camera-angle scrolling, clear colours, and MCQ2 offsets. The backdrop is independent of model lighting and depth, and is redrawn only when the camera or image changes. Encounter camera scripts, palette cycling, runtime stage effects, and SC's stage-specific lighting are not simulated; the existing orbit, animation, and lighting controls remain available.

Battle-stage wheel zoom moves the orbit target forward as the camera approaches it, allowing travel through the arena instead of stopping at its centre. Right-drag pan uses twice the standard speed and retains an arena-scale minimum pivot distance so it stays useful after zooming in. **Fit view** restores the initial framing.

Read-only validation of all extracted stage models, animation part counts, texture UV/palette coverage, and backdrops:

```powershell
rtk proxy node tools/asset-viewer/verify-battle-stages.mjs D:/java/sc/files
```

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
