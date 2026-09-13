"""Render SC native TMD/TIM meshes into registered X/Z terrain guide images.

Run after ExportWorldMapMesh.java, see README.md. Requires numpy and Pillow.
Uses an orthographic height buffer, native TIM palettes/UVs and static face shading.
No route-derived warping, manual registration or gameplay camera projection.
"""
import argparse
import json
import struct
from pathlib import Path
import numpy as np
from PIL import Image


def load_mesh(path):
    raw = path.read_bytes()
    polygons = []
    offset = 0
    while offset < len(raw):
        count, page, clut, part = struct.unpack_from('>4i', raw, offset)
        offset += 16
        vertices = []
        for _ in range(count):
            vertices.append(struct.unpack_from('>3f3i', raw, offset))
            offset += 24
        polygons.append((np.array(vertices), page, clut, part))
    return polygons


def load_vram(directory):
    vram = np.zeros((512, 1024), dtype=np.uint16)
    for path in sorted((p for p in directory.iterdir() if p.name.isdigit()), key=lambda p: int(p.name)):
        raw = path.read_bytes()
        if len(raw) < 8 or struct.unpack_from('<I', raw)[0] != 0x10:
            continue
        flags = struct.unpack_from('<I', raw, 4)[0]
        offset = 8
        for _ in range(2 if flags & 8 else 1):
            size, x, y, width, height = struct.unpack_from('<I4H', raw, offset)
            data = np.frombuffer(raw, dtype='<u2', count=width * height, offset=offset + 12).reshape(height, width)
            if x + width > 1024 or y + height > 512:
                raise ValueError(f'TIM outside VRAM: {path}')
            vram[y:y+height, x:x+width] = data
            offset += size
    return vram


def render(mesh, textures, target, resolution):
    polygons = load_mesh(mesh)
    positions = np.concatenate([p[0][:, :3] for p in polygons])
    lower = positions[:, [0, 2]].min(axis=0) - 16
    upper = positions[:, [0, 2]].max(axis=0) + 16
    extent = upper - lower
    scale = resolution / extent.max()
    width, height = np.ceil(extent * scale).astype(int)
    # Exact registration matches the generated pixel grid, including the last partial pixel.
    extent = np.array([width, height]) / scale
    pixels = np.zeros((height, width, 4), dtype=np.uint8)
    depth = np.full((height, width), np.inf, dtype=np.float32)
    vram = load_vram(textures)
    triangles = 0
    # Opaque geometry establishes terrain depth; translucent decorative faces blend afterward.
    polygons.sort(key=lambda p: (bool(p[3] & 0x10000), -float(p[0][:, 1].mean())))
    for vertices, page, clut, part in polygons:
        for indices in ((0, 1, 2), (1, 2, 3)) if len(vertices) == 4 else ((0, 1, 2),):
            tri = vertices[list(indices)]
            xy = (tri[:, [0, 2]] - lower) * scale
            xmin, ymin = np.maximum(np.floor(xy.min(axis=0)).astype(int), 0)
            xmax, ymax = np.minimum(np.ceil(xy.max(axis=0)).astype(int), [width - 1, height - 1])
            a, b, c = xy
            denominator = (b[1]-c[1])*(a[0]-c[0]) + (c[0]-b[0])*(a[1]-c[1])
            if abs(denominator) < 1e-8 or xmin > xmax or ymin > ymax:
                continue
            yy, xx = np.mgrid[ymin:ymax+1, xmin:xmax+1]
            xx = xx + .5; yy = yy + .5
            wa = ((b[1]-c[1])*(xx-c[0]) + (c[0]-b[0])*(yy-c[1])) / denominator
            wb = ((c[1]-a[1])*(xx-c[0]) + (a[0]-c[0])*(yy-c[1])) / denominator
            wc = 1-wa-wb
            ys = wa*tri[0, 1] + wb*tri[1, 1] + wc*tri[2, 1]
            old_depth = depth[ymin:ymax+1, xmin:xmax+1]
            mask = (wa >= -1e-7) & (wb >= -1e-7) & (wc >= -1e-7) & (ys <= old_depth)
            colours = tri[:, 5].astype(np.int64)
            rgb = np.stack([(colours >> shift) & 255 for shift in (0, 8, 16)], axis=1)
            colour = wa[..., None]*rgb[0] + wb[..., None]*rgb[1] + wc[..., None]*rgb[2]
            if page >= 0:
                u = np.rint(wa*tri[0, 3] + wb*tri[1, 3] + wc*tri[2, 3]).astype(int) & 255
                v = np.rint(wa*tri[0, 4] + wb*tri[1, 4] + wc*tri[2, 4]).astype(int) & 255
                tx, ty, bpp = (page & 15)*64, ((page >> 4) & 1)*256, (page >> 7) & 3
                if bpp == 0:
                    packed = vram[(ty+v) % 512, (tx+u//4) % 1024]
                    index = (packed >> ((u % 4)*4)) & 15
                    texel = vram[(clut >> 6) % 512, ((clut & 63)*16+index) % 1024]
                elif bpp == 1:
                    packed = vram[(ty+v) % 512, (tx+u//2) % 1024]
                    index = (packed >> ((u % 2)*8)) & 255
                    texel = vram[(clut >> 6) % 512, ((clut & 63)*16+index) % 1024]
                elif bpp == 2:
                    texel = vram[(ty+v) % 512, (tx+u) % 1024]
                else:
                    raise ValueError('24-bit TMD textures are not supported by the native guide renderer')
                mask &= texel != 0
                texcolour = np.stack([(texel >> shift) & 31 for shift in (0, 5, 10)], axis=-1) * (255/31)
                colour = texcolour * colour / 128
            normal = np.cross(tri[1, :3]-tri[0, :3], tri[2, :3]-tri[0, :3])
            normal = normal / max(np.linalg.norm(normal), 1)
            if normal[1] > 0:
                normal = -normal
            brightness = .70 + .30*max(0, np.dot(normal, np.array([-.35, -1, -.25])/1.0886))
            patch = pixels[ymin:ymax+1, xmin:xmax+1]
            rendered = np.clip(colour*brightness, 0, 255)
            if part & 0x10000 and page >= 0:
                transparent = mask & ((texel & 0x8000) != 0)
                background = patch[..., :3].astype(float)
                blend = (page >> 5) & 3
                mixed = ((background+rendered)/2 if blend == 0 else background+rendered if blend == 1 else background-rendered if blend == 2 else background+rendered/4)
                rendered[transparent] = np.clip(mixed[transparent], 0, 255)
            patch[mask, :3] = rendered[mask].astype(np.uint8)
            patch[mask, 3] = 255
            old_depth[mask] = ys[mask]
            triangles += 1
    Image.fromarray(pixels).save(target, optimize=True)
    return dict(x=float(lower[0]), z=float(lower[1]), width=float(extent[0]), height=float(extent[1]), triangles=triangles)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mesh', type=Path)
    parser.add_argument('textures', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--resolution', type=int, default=2048)
    args = parser.parse_args()
    print(json.dumps(render(args.mesh, args.textures, args.output, args.resolution)))
