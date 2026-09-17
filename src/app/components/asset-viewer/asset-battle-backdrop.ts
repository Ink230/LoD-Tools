import * as THREE from 'three';
import { BattleBackdrop, battleBackdropPlacement } from './asset-battle-stage';

/** A camera-scrolling MCQ background, independent of the arena's depth and lighting. */
export class BattleBackdropRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly source = document.createElement('canvas');
  private texture = this.makeTexture();
  private previous: BattleBackdrop | null = null;
  private previousView = '';

  private makeTexture() {
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  render(backdrop: BattleBackdrop, camera: THREE.PerspectiveCamera, target: THREE.Vector3, colour = '#18221c'): THREE.Texture {
    const delta = camera.position.clone().sub(target);
    const view = backdrop.mode ? `${camera.aspect}:${colour}` : `${camera.aspect}:${delta.x}:${delta.y}:${delta.z}`;
    if (this.previous === backdrop && this.previousView === view) return this.texture;
    this.previousView = view;
    if (this.previous !== backdrop) {
      this.previous = backdrop;
      this.source.width = backdrop.image.width;
      this.source.height = backdrop.image.height;
      this.source.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(backdrop.image.pixels), this.source.width, this.source.height), 0, 0);
    }
    const height = backdrop.mode ? Math.min(2048, backdrop.image.height) : 240;
    const width = Math.max(1, Math.round(height * camera.aspect));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.texture.dispose();
      this.canvas.width = width;
      this.canvas.height = height;
      this.texture = this.makeTexture();
    }
    const context = this.canvas.getContext('2d')!;
    if (backdrop.mode) {
      context.fillStyle = colour;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.imageSmoothingEnabled = false;
      const scale = Math.min(this.canvas.width / this.source.width, this.canvas.height / this.source.height);
      const width = this.source.width * scale, height = this.source.height * scale;
      context.drawImage(this.source, (this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
      this.texture.needsUpdate = true;
      return this.texture;
    }
    // Undo the viewer's PSX-to-Three axis conversion.
    const { left, top, clear } = battleBackdropPlacement(backdrop, [delta.x, -delta.y, -delta.z]);
    context.fillStyle = `rgb(${clear.join(',')})`;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.imageSmoothingEnabled = false;
    const tileWidth = this.source.width;
    const start = ((left % tileWidth) + tileWidth) % tileWidth - tileWidth;
    for (let x = start; x < this.canvas.width; x += tileWidth) context.drawImage(this.source, x, top);
    this.texture.needsUpdate = true;
    return this.texture;
  }

  dispose() { this.texture.dispose(); }
}
