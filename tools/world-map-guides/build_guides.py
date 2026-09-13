"""Regenerate registered guide images from a local SC extraction; no game process is launched."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
from render_guides import render

REGIONS = ['south_serdio', 'north_serdio', 'tiberoa', 'illisa_bay', 'mille_seseau', 'gloriano', 'death_frontier', 'endiness']


def build(sc, java, output, work):
    output.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    separator = ';' if __import__('os').name == 'nt' else ':'
    classpath = separator.join(str(sc / path) for path in ['build/classes/java/main', 'src/main/resources', 'build/libs/libs/*'])
    subprocess.run([str(java/'bin/javac'), '-cp', classpath, '-d', str(work), str(Path(__file__).with_name('ExportWorldMapMesh.java'))], cwd=sc, check=True)
    def region(item):
        index, name = item
        mesh = work / (name + '.mesh')
        subprocess.run([str(java/'bin/java'), '-cp', str(work)+separator+classpath, 'ExportWorldMapMesh', str(sc/f'files/SECT/DRGN0.BIN/{5705+index}'), str(mesh)], cwd=sc, check=True)
        filename = name.replace('_', '-') + '.png'
        registration = render(mesh, sc/f'files/SECT/DRGN0.BIN/{5697+index}', output/filename, 2048)
        print(name, registration, flush=True)
        return dict(region='lod:wmap_region_'+name, image='assets/world-map/terrain/'+filename, **registration)
    with ThreadPoolExecutor(max_workers=2) as pool:
        guides = list(pool.map(region, enumerate(REGIONS)))
    (output/'index.json').write_text(json.dumps(dict(guides=guides), indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sc-root', required=True, type=Path)
    parser.add_argument('--java-home', required=True, type=Path)
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[2]/'src/assets/world-map/terrain')
    args = parser.parse_args()
    build(args.sc_root.resolve(), args.java_home.resolve(), args.output.resolve(), args.work.resolve())
