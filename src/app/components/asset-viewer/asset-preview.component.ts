import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { AssetRecord, AssetFormat, PREVIEW_FORMATS } from './asset-catalog';
import { decodeTim, decodeMcq, texturePageFromTims } from './asset-image';
import { decodeModel } from './asset-model';
import { decodeAnimation, decodeLmb, decodeAnm, decodeClutAnimationDetails, DecodedClutAnimation, LmbType } from './asset-animation';
import { copyPaletteRow } from './asset-palette';
import { decodeEnvironment, decodeCollision } from './asset-scene';
import { decodeSpuSample, listSpuSamples, encodeWav } from './asset-audio';
import { fileBytes } from './asset-source';
import { ModelAsset, ModelAnimation, PixelImage, SceneOverlay, SpriteAnimation } from './asset-preview-types';
import { AssetStageComponent } from './asset-stage.component';

@Component({
  selector: 'app-asset-preview', imports: [FormsModule, JsonPipe, AssetStageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-preview.component.html', styleUrl: './asset-preview.component.css',
})
export class AssetPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() bytes: Uint8Array = new Uint8Array();
  @Input() record!: AssetRecord;
  @Input() related: AssetRecord[] = [];
  @Input() readFile?: (path: string) => Promise<Uint8Array>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild(AssetStageComponent) stage?: AssetStageComponent;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  readonly formats = PREVIEW_FORMATS;
  format: AssetFormat = 'Unknown';
  loading = false;
  error = '';
  warnings: string[] = [];
  mediaUrl = '';
  image: PixelImage | null = null;
  model: ModelAsset | null = null;
  animation: ModelAnimation | null = null;
  sprite: SpriteAnimation | null = null;
  clut: DecodedClutAnimation | null = null;
  overlay: SceneOverlay | null = null;
  texturePages = new Map<string, PixelImage>();
  textures: Uint8Array[] = [];
  palette = 0;
  paletteCount = 1;
  lmbType: LmbType = 0;
  frame = 0;
  playing = false;
  wireframe = false;
  showRecords = false;
  sampleRate = 44100;
  sampleIndex = 0;
  samples: { offset: number; length: number }[] = [];
  sampleDetails = '';
  animationPath = '';
  private loadVersion = 0;
  private companionVersion = 0;
  private destroyed = false;
  private raf = 0;
  private lastTick = 0;
  private durations: number[] = [];
  get frameCount() { return this.animation?.frames.length || this.sprite?.frames.length || this.clut?.steps.length || 0; }
  get animations() { return this.related.filter(item => ['Animation', 'CMB', 'LMB'].includes(item.format)); }
  get modelChoices() { return this.related.filter(item => item.format === 'TMD'); }

  ngAfterViewInit() { this.draw(); }
  ngOnChanges(changes: SimpleChanges) { if ((changes['record'] || changes['bytes']) && this.record && this.bytes.length) { this.format = this.record.format; this.lmbType = (this.record.lmbType || 0) as LmbType; void this.load(); } }
  private url(bytes: Uint8Array, type: string) {
    if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl);
    this.mediaUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type }));
  }
  async load() {
    const version = ++this.loadVersion;
    ++this.companionVersion;
    this.playing = false; this.frame = 0; this.loading = true; this.error = ''; this.warnings = [];
    this.image = null; this.model = null; this.animation = null; this.sprite = null; this.clut = null; this.overlay = null;
    this.texturePages = new Map(); this.textures = []; this.palette = 0; this.samples = []; this.animationPath = ''; this.showRecords = false;
    if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl);
    this.mediaUrl = '';
    try {
      const textures: Uint8Array[] = [];
      let textureSize = 0;
      if (this.readFile && !['PNG', 'Opus', 'SPU', 'TIM', 'MCQ', 'Environment', 'Collision', 'Unknown'].includes(this.format)) {
        for (const path of (this.record.textures || []).slice(0, 32)) {
          try {
            const bytes = await this.readFile(path);
            textureSize += bytes.length;
          if (textureSize > 32 * 1024 * 1024) {
            if (version === this.loadVersion) this.warnings.push('Texture set exceeds 32 MiB preview limit');
            break;
          }
            textures.push(bytes);
          } catch { if (version === this.loadVersion) this.warnings.push(`Texture unavailable: ${path}`); }
          if (version !== this.loadVersion || this.destroyed) return;
        }
      }
      if (version !== this.loadVersion || this.destroyed) return;
      this.textures = textures;
      switch (this.format) {
        case 'PNG': this.url(this.bytes, 'image/png'); break;
        case 'Opus': this.url(this.bytes, 'audio/ogg'); break;
        case 'TIM': this.updatePalette(); break;
        case 'MCQ': this.image = decodeMcq(this.bytes); break;
        case 'SPU': this.samples = listSpuSamples(this.bytes); this.sampleIndex = 0; this.updateSample(); break;
        case 'TMD': {
          this.model = decodeModel(this.bytes); this.warnings.push(...this.model.warnings);
          const idle = this.animations.find(item => item.format === 'Animation' && item.model === this.record.path && (item.modelOffset || 0) === (this.record.offset || 0));
          if (idle) await this.chooseAnimation(this.key(idle));
          if (version !== this.loadVersion || this.destroyed) return;
          break;
        }
        case 'Animation': case 'CMB': case 'LMB': {
          this.animation = this.format === 'LMB' ? decodeLmb(this.bytes, this.lmbType) : decodeAnimation(this.bytes);
          this.warnings.push(...this.animation.warnings);
          if (this.record.model && this.readFile) {
            try {
              const bytes = await this.readFile(this.record.model);
              if (version !== this.loadVersion || this.destroyed) return;
              this.model = decodeModel(bytes.subarray(this.record.modelOffset || 0));
            } catch { if (version === this.loadVersion) this.warnings.push('The companion model could not be loaded. Showing animated part axes; you can choose a model file.'); }
          }
          break;
        }
        case 'ANM': this.sprite = decodeAnm(this.bytes); this.warnings.push(...this.sprite.warnings); break;
        case 'Environment': case 'Collision': {
          let environment: SceneOverlay | null = this.format === 'Environment' ? decodeEnvironment(this.bytes) : null;
          let collision: SceneOverlay | null = this.format === 'Collision' ? decodeCollision(this.bytes) : null;
          if (this.readFile) {
            try {
              const envBytes = this.record.environment ? await this.readFile(this.record.environment) : null;
              const colBytes = this.record.collision ? await this.readFile(this.record.collision) : null;
              const infoBytes = this.record.collisionInfo ? await this.readFile(this.record.collisionInfo) : undefined;
              if (version !== this.loadVersion || this.destroyed) return;
              if (envBytes) environment = decodeEnvironment(envBytes);
              if (colBytes || this.format === 'Collision') collision = decodeCollision(colBytes || this.bytes, infoBytes);
            } catch { if (version === this.loadVersion) this.warnings.push('Some companion scene resources could not be loaded'); }
          }
          this.overlay = { format: 'Environment & collision', camera: environment?.camera, polygons: collision?.polygons || [], records: [...(environment?.records || []), ...(collision?.records || [])], warnings: [...(environment?.warnings || []), ...(collision?.warnings || [])] };
          this.warnings.push(...this.overlay.warnings); break;
        }
        case 'CLUT': {
          this.clut = decodeClutAnimationDetails(this.bytes);
          this.overlay = { format: 'Palette animation', polygons: [], records: this.clut.steps.map((step, i) => ({ label: `Frame ${i}`, values: { sourceRow: step.sourceYOffset, duration: step.durationTicks, targetRow: this.clut!.targetClutIndex } })), warnings: this.clut.warnings };
          this.showRecords = true; this.warnings.push(...this.clut.warnings); break;
        }
        default: this.error = 'This resource is not recognized. Choose a format to inspect it.';
      }
      this.buildTexturePages();
      this.durations = this.sprite?.frames.map(frame => frame.duration / this.sprite!.fps) || this.clut?.steps.map(step => Math.max(1, step.durationTicks) / 30) || [];
    } catch (error) { if (version === this.loadVersion) this.error = error instanceof Error ? error.message : 'Unable to decode this resource'; }
    finally {
      if (version === this.loadVersion && !this.destroyed) { this.loading = false; this.cdr.detectChanges(); this.draw(); }
    }
  }
  updatePalette() {
    try { const image = decodeTim(this.bytes, Number(this.palette)); this.paletteCount = image.paletteCount; this.image = image; this.draw(); }
    catch (error) { this.error = String(error); }
  }
  updateSample() {
    try {
      const offset = this.samples[Number(this.sampleIndex)]?.offset ?? 0;
      const sample = decodeSpuSample(this.bytes, Number(this.sampleRate), offset);
      if (!sample.samples.length) { this.sampleDetails = 'Empty sound bank'; if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl); this.mediaUrl = ''; return; }
      this.url(encodeWav(sample.samples, sample.sampleRate), 'audio/wav');
      this.sampleDetails = `${sample.samples.length.toLocaleString()} samples · ${(sample.samples.length / sample.sampleRate).toFixed(2)} s${sample.loopStart !== null ? ' · Loop markers present' : ''}`;
    } catch (error) { this.error = String(error); }
  }
  private buildTexturePages() {
    const pages = new Map<string, PixelImage>();
    if (this.textures.length) {
      for (const primitive of this.model?.parts.flatMap(part => part.primitives) || []) {
        if (primitive.clut === undefined || primitive.tpage === undefined) continue;
        const key = `${primitive.clut}:${primitive.tpage}`;
        if (!pages.has(key) && pages.size < 256) pages.set(key, texturePageFromTims(this.textures, primitive.clut, primitive.tpage));
      }
      for (const frame of this.sprite?.frames || []) for (const piece of frame.pieces) {
        const key = `${piece.clut}:${piece.tpage}`;
        if (!pages.has(key) && pages.size < 256) pages.set(key, texturePageFromTims(this.textures, piece.clut, this.record.path.startsWith('SUBMAP/savepoint/') ? 31 : piece.tpage));
      }
    }
    this.texturePages = pages;
  }
  async chooseAnimation(path: string) {
    const request = ++this.companionVersion;
    this.playing = false; this.frame = 0; this.animationPath = path;
    if (!path) { this.animation = null; return; }
    const record = this.animations.find(item => this.key(item) === path);
    if (!record || !this.readFile) return;
    const version = this.loadVersion;
    try {
      const bytes = (await this.readFile(record.path)).subarray(record.offset || 0);
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) return;
      this.animation = record.format === 'LMB' ? decodeLmb(bytes, (record.lmbType || 0) as LmbType) : decodeAnimation(bytes);
    } catch (error) { if (version === this.loadVersion && request === this.companionVersion) this.error = String(error); }
    this.cdr.markForCheck();
  }
  key(record: AssetRecord) { return `${record.path}@${record.offset || 0}`; }
  async attach(event: Event, kind: 'texture' | 'model' | 'animation') {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []); input.value = '';
    const version = this.loadVersion;
    const request = ++this.companionVersion;
    try {
      if (kind === 'texture' && (files.length > 32 || files.reduce((sum, file) => sum + file.size, 0) > 32 * 1024 * 1024)) throw new Error('Select at most 32 textures totaling 32 MiB');
      const bytes = await Promise.all(files.map(file => fileBytes(file)));
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed || !bytes.length) return;
      if (kind === 'texture') this.textures = bytes;
      if (kind === 'model') this.model = decodeModel(bytes[0]);
      if (kind === 'animation') { this.animation = this.lmbType === undefined ? decodeAnimation(bytes[0]) : (new DataView(bytes[0].buffer).getUint32(0, true) === 0x00424d4c ? decodeLmb(bytes[0], this.lmbType) : decodeAnimation(bytes[0])); this.frame = 0; }
      this.buildTexturePages(); this.cdr.detectChanges(); this.draw();
    } catch (error) { if (version === this.loadVersion && request === this.companionVersion) this.error = String(error); this.cdr.markForCheck(); }
  }
  togglePlayback() {
    this.playing = !this.playing;
    cancelAnimationFrame(this.raf);
    if (!this.playing) return;
    this.lastTick = performance.now();
    const tick = (now: number) => {
      if (!this.playing || this.destroyed) return;
      const duration = (this.durations[this.frame] || 1 / (this.animation?.fps || 30)) * 1000;
      if (now - this.lastTick >= duration) {
        this.lastTick = now;
        this.zone.run(() => { this.frame = (this.frame + 1) % this.frameCount; this.cdr.markForCheck(); this.draw(); });
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.zone.runOutsideAngular(() => { this.raf = requestAnimationFrame(tick); });
  }
  scrub() { this.playing = false; this.frame = Number(this.frame); this.draw(); }
  private draw() {
    if (this.clut && this.textures[0]) {
      try {
        const bytes = copyPaletteRow(this.textures[0], this.clut.steps[this.frame].sourceYOffset, this.clut.targetClutIndex);
        const width = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(16, true);
        const bpp = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) & 3;
        this.image = decodeTim(bytes, this.clut.targetClutIndex * width / (bpp === 0 ? 16 : 256));
      } catch (error) { this.error = String(error); this.playing = false; }
    }
    if (!this.image && !this.sprite) return;
    const canvas = this.canvas?.nativeElement;
    if (!canvas) return;
    const context = canvas.getContext('2d'); if (!context) return;
    if (this.image) {
      canvas.width = this.image.width; canvas.height = this.image.height;
      context.putImageData(new ImageData(new Uint8ClampedArray(this.image.pixels), this.image.width, this.image.height), 0, 0);
    } else if (this.sprite) {
      canvas.width = 512; canvas.height = 512;
      context.imageSmoothingEnabled = false;
      for (const piece of this.sprite.frames[this.frame]?.pieces || []) {
        const page = this.texturePages.get(`${piece.clut}:${piece.tpage}`);
        if (!page) continue;
        const source = document.createElement('canvas'); source.width = page.width; source.height = page.height;
        source.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(page.pixels), page.width, page.height), 0, 0);
        context.save(); context.translate(256 + piece.x, 256 + piece.y); context.rotate(piece.rotation); context.scale(piece.flipX ? -1 : 1, piece.flipY ? -1 : 1);
        context.drawImage(source, piece.u, piece.v, piece.width, piece.height, 0, 0, piece.width, piece.height); context.restore();
      }
    }
  }
  ngOnDestroy() { this.destroyed = true; ++this.loadVersion; cancelAnimationFrame(this.raf); if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl); }
}
