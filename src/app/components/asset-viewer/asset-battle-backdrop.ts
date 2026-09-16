import * as THREE from 'three';
import { BattleBackdrop, battleBackdropPlacement } from './asset-battle-stage';

/** A camera-scrolling MCQ background, independent of the arena's depth and lighting. */
export class BattleBackdropRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly source = document.createElement('canvas');
  private readonly texture = new THREE.CanvasTexture(this.canvas);
  private previous: BattleBackdrop | null = null;
  private previousView = '';

  constructor() {
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
  }

  render(backdrop: BattleBackdrop, camera: THREE.PerspectiveCamera, target: THREE.Vector3): THREE.Texture {
    const delta = camera.position.clone().sub(target);
    const view = `${camera.aspect}:${delta.x}:${delta.y}:${delta.z}`;
    if (this.previous === backdrop && this.previousView === view) return this.texture;
    this.previousView = view;
    if (this.previous !== backdrop) {
      this.previous = backdrop;
      this.source.width = backdrop.image.width;
      this.source.height = backdrop.image.height;
      this.source.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(backdrop.image.pixels), this.source.width, this.source.height), 0, 0);
    }
    this.canvas.width = Math.max(1, Math.round(240 * camera.aspect));
    this.canvas.height = 240;
    const context = this.canvas.getContext('2d')!;
    // Undo the viewer's PSX-to-Three axis conversion.
    const { left, top, clear } = battleBackdropPlacement(backdrop, [delta.x, -delta.y, -delta.z]);
    context.fillStyle = `rgb(${clear.join(',')})`;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.imageSmoothingEnabled = false;
    const width = this.source.width;
    const start = ((left % width) + width) % width - width;
    for (let x = start; x < this.canvas.width; x += width) context.drawImage(this.source, x, top);
    this.texture.needsUpdate = true;
    return this.texture;
  }

  dispose() { this.texture.dispose(); }
}
