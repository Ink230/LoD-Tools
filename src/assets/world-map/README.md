# Vanilla world map preset

`vanilla.wmap` was exported by the Severed Chains `WorldMapPreset.vanilla()` API and checked through its Java version 1 XML codec. It contains the full native graph and presentation data: 94 nodes, 66 geometry paths, 132 directed routes, 256 portals and 249 places

The editor uses X/Z for its 2D graph and exposes Y (height) in the inspector. Region filtering follows portal region-to-route assignments. Native game models and textures are not distributed with the editor

`world-map-registry.ts` in the editor feature contains native registry IDs derived from this export, including referenced encounter IDs. These supply reference suggestions and let partial overlays reference omitted native defaults

Plain `.wmap` exports use sibling assets. A `.wmap.zip` export contains exactly one root `preset.wmap` plus files at the paths referenced by its asset manifest. ZIP and XML limits match the runtime: 16 MiB XML, 64 MiB per asset, 256 MiB package and 4096 entries. Asset paths are relative and cannot contain backslashes, colons, NUL, absolute paths, `.` or `..` segments

Presets overlay registered defaults. Deleting a native graph entry creates a removal record; deleting a custom overlay omits it. Use the Removals section to remove entries registered by a custom mod. Reserved native portal slots 0–255 cannot be removed. Code-backed providers and behaviours require their supplying mods to be installed

Unknown XML fields are preserved by the editor to avoid data loss and rejected by the runtime. Browser diagnostics cover graph references and package paths; the Severed Chains codec and resolved registry snapshot remain authoritative for gameplay validity
