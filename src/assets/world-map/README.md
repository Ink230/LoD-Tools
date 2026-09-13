# Vanilla world map preset

`vanilla.wmap` is exported by Severed Chains through the `WorldMapPreset.vanilla()` API and checked through its Java version 1 XML codec. It contains the full native graph and presentation data: 94 nodes, 66 geometry paths, 132 directed routes, 256 portals and 249 places. It also contains the reusable authoring catalogs resolved by that graph: 38 thumbnails, 5 services, 12 sounds, 8 battle stages and 176 submap destinations.

The editor uses X/Z for its 2D graph and exposes Y (height) in the inspector. Region filtering follows portal region-to-route assignments. Native game models and textures are not distributed by the editor.

The editor reads native registry IDs and display labels directly from `vanilla.wmap`, while `world-map-registry.ts` supplies engine registry IDs that are referenced but not defined by the preset, including encounters. Together they supply labeled reference suggestions when partial overlays reference omitted native defaults. Inputs remain editable so installed mods can provide IDs outside the native catalog.

Registry-ID attributes and collections are the primary authoring surface. Retail indices and bitmasks remain in a collapsed Native compatibility section and are preserved when old files are loaded or exported. The place-keyed `thumbnails` section is the older per-place asset override; `thumbnailDefinitions` contains reusable thumbnail resources.

Plain `.wmap` exports use sibling assets. A `.wmap.zip` export contains exactly one root `preset.wmap` plus files at paths referenced by its asset manifest. ZIP and XML limits match the runtime: 16 MiB XML, 64 MiB per asset, 256 MiB package and 4096 entries. Asset paths are relative and cannot contain backslashes, colons, NUL, absolute paths, or `.` and `..` segments.

Presets overlay registered defaults. Deleting a native graph entry creates a removal record; deleting a custom overlay omits it. Use the Removals section to remove entries registered by a custom mod. Reserved native portal slots 0–255 cannot be removed. Code-backed providers and behaviours require the supplying mods to be installed.

Unknown XML fields are preserved by the editor to avoid data loss but are rejected by the runtime. Browser diagnostics cover graph references and package paths; the Severed Chains codec and resolved registry snapshot remain authoritative for gameplay validity.
