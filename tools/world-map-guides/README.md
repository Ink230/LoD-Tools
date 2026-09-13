# Native world map terrain guides

These static top-down images provide terrain context underneath the editor's
routes and nodes. They use the native model's X/Z coordinates directly; no
landmark matching or route-based image stretching is applied. Positive Z points
down in the stored image. The editor inverts this axis for the native camera's
top-down orientation, then applies the selected compass rotation to both terrain
and graph. Height Y determines visible surfaces in the rasterizer. Display
orientation never changes exported coordinates; pointer and keyboard edits use
the inverse display transform. Labels remain upright in every orientation.

## Regenerate

Requirements: an SC checkout with extracted retail files and compiled Java
classes/dependencies, its compatible JDK, and Python with NumPy and Pillow.
From the website directory, using an external virtual environment:

```powershell
python -m venv C:\temp\wmap\guide-env
C:\temp\wmap\guide-env\Scripts\python.exe -m pip install numpy pillow
C:\temp\wmap\guide-env\Scripts\python.exe tools/world-map-guides/build_guides.py --sc-root D:\java\sclocal --java-home 'C:\Program Files\Java\jdk-25' --work C:\temp\wmap\guide-build
```

The generator reads model files `SECT/DRGN0.BIN/5705` through `5712` and
texture directories `5697` through `5704`. The Java bridge uses SC's TMD
decoder; Python decodes TIM textures and rasterizes the exported triangles.
It does not launch the game or modify the SC checkout.

Output goes to `src/assets/world-map/terrain`. `index.json` associates each
image with a region registry ID and its exact X/Z origin and dimensions.
The editor places this image beneath the graph without changing preset data.

These are editing references, not screenshots of the engine renderer: lighting
is static, and animated water, moving decorations, atmosphere and runtime
palette effects are not reproduced. Custom regions can instead import a PNG,
JPEG or WebP and configure its position, dimensions, rotation and opacity.
Custom guide images stay in browser storage and are not game assets or part of
the exported `.wmap` preset.
