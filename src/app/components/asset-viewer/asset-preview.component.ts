import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { AssetRecord, AssetFormat, PREVIEW_FORMATS, assetCategory, gameIdentity } from './asset-catalog';
import { decodeTim, decodeMcq, texturePageFromTims } from './asset-image';
import { decodeModel } from './asset-model';
import { decodeAnimation, decodeLmb, decodeAnm, decodeClutAnimationDetails, DecodedClutAnimation, LmbType } from './asset-animation';
import { copyPaletteRow } from './asset-palette';
import { decodeEnvironment, decodeCollision } from './asset-scene';
import { decodeSpuSample, listSpuSamples, encodeWav } from './asset-audio';
import { AssetCompanionPickerComponent, CompanionKind, companionFormats } from './asset-companion-picker.component';
import { ModelAsset, ModelAnimation, PixelImage, SceneOverlay, SpriteAnimation } from './asset-preview-types';
import { AssetStageComponent } from './asset-stage.component';

@Component({
  selector: 'app-asset-preview', imports: [FormsModule, JsonPipe, AssetStageComponent, AssetCompanionPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-preview.component.html', styleUrl: './asset-preview.component.css',
})
export class AssetPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() bytes: Uint8Array = new Uint8Array();
  @Input() record!: AssetRecord;
  @Input() related: AssetRecord[] = [];
  @Input() assets: AssetRecord[] = [];
  @Input() thumbnails = new Map<string, string>();
  @Output() previewLoaded = new EventEmitter<{ key: string; url: string }>();
  @Output() navigateAsset = new EventEmitter<AssetRecord>();
  loadedCompanions: Record<CompanionKind, AssetRecord[]> = { texture: [], model: [], animation: [] };
  picker: CompanionKind | null = null;
  readonly companionKinds: CompanionKind[] = ['texture', 'model', 'animation'];
  selectedAnimation: AssetRecord | null = null;
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
  get animations() {
    const records = this.related.filter(item => ['Animation', 'CMB', 'LMB'].includes(item.format));
    if (this.selectedAnimation && !records.some(item => this.key(item) === this.key(this.selectedAnimation!))) records.push(this.selectedAnimation);
    return records;
  }
  get modelChoices() { return this.related.filter(item => item.format === 'TMD'); }

  ngAfterViewInit() { this.draw(); }
  ngOnChanges(changes: SimpleChanges) { if ((changes['record'] || changes['bytes']) && this.record && this.bytes.length) { this.format = this.record.format; this.lmbType = (this.record.lmbType || 0) as LmbType; void this.load(); } }
  private url(bytes: Uint8Array, type: string) {
    if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl);
    this.mediaUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type }));
  }
  async load() {
    const version = ++this.loadVersion; this.picker = null; this.selectedAnimation = null;
    ++this.companionVersion;
    this.loadedCompanions = { texture: [], model: [], animation: [] };
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
          if (version === this.loadVersion) this.loadedCompanions.texture.push(this.reference(path, 'TIM', bytes.length));
          if (version === this.loadVersion) this.captureTexture(bytes, `${path}@0`);
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
          this.loadedCompanions.model = [this.record];
          const idle = this.animations.find(item => item.format === 'Animation' && item.model === this.record.path && (item.modelOffset || 0) === (this.record.offset || 0));
          if (idle) await this.chooseAnimation(this.key(idle));
          if (version !== this.loadVersion || this.destroyed) return;
          break;
        }
        case 'Animation': case 'CMB': case 'LMB': {
          this.animation = this.format === 'LMB' ? decodeLmb(this.bytes, this.lmbType) : decodeAnimation(this.bytes);
          this.animationPath = this.key(this.record);
          this.loadedCompanions.animation = [this.record];
          this.warnings.push(...this.animation.warnings);
          if (this.record.model && this.readFile) {
            try {
              const bytes = await this.readFile(this.record.model);
              if (version !== this.loadVersion || this.destroyed) return;
              this.model = decodeModel(bytes.subarray(this.record.modelOffset || 0));
              this.loadedCompanions.model = [this.reference(this.record.model, 'TMD', bytes.length, this.record.modelOffset || 0)];
            } catch { if (version === this.loadVersion) this.warnings.push('The companion model could not be loaded. Showing animated part axes; you can choose a model file.'); }
          }
          break;
        }
        case 'ANM': this.sprite = decodeAnm(this.bytes); this.loadedCompanions.animation = [this.record]; this.warnings.push(...this.sprite.warnings); break;
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
      if (version === this.loadVersion && !this.destroyed) { this.loading = false; this.cdr.detectChanges(); this.draw(); this.capturePreview(); }
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
    if (!path) { this.animation = null; this.loadedCompanions.animation = []; return; }
    const record = this.animations.find(item => this.key(item) === path);
    if (!record || !this.readFile) return;
    const version = this.loadVersion;
    try {
      const bytes = (await this.readFile(record.path)).subarray(record.offset || 0);
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) return;
      this.animation = record.format === 'LMB' ? decodeLmb(bytes, (record.lmbType || 0) as LmbType) : decodeAnimation(bytes);
      this.loadedCompanions.animation = [record];
    } catch (error) { if (version === this.loadVersion && request === this.companionVersion) this.error = String(error); }
    this.cdr.markForCheck();
  }
  key(record: AssetRecord) { return `${record.path}@${record.offset || 0}`; }
  reference(path: string, format: AssetFormat, size: number, offset = 0): AssetRecord {
    return this.assets.find(asset => asset.path === path && (asset.offset || 0) === offset && asset.format === format)
      || { path, name: path.split('/').at(-1) || path, format, offset, size, category: assetCategory(format), ...gameIdentity(path) };
  }
  companionName(asset: AssetRecord) { return `${asset.gameAsset} / ${asset.name}`; }
  companionCandidates(kind: CompanionKind) {
    const formats = companionFormats(kind);
    return this.assets.filter(asset => formats.includes(asset.format) && (kind !== 'texture' || asset.size <= 32 * 1024 * 1024));
  }
  async stepCompanion(kind: CompanionKind, direction: number) {
    const candidates = this.companionCandidates(kind);
    if (!candidates.length) { this.error = `No compatible ${kind} assets are available`; return; }
    const current = this.loadedCompanions[kind].at(-1);
    const index = current ? candidates.findIndex(asset => this.key(asset) === this.key(current)) : -1;
    const next = index < 0 ? (direction > 0 ? 0 : candidates.length - 1) : (index + direction + candidates.length) % candidates.length;
    await this.attach([candidates[next]], kind);
  }
  closePicker() { this.picker = null; ++this.companionVersion; }
  async randomCompanion(kind: CompanionKind) {
    const candidates = this.companionCandidates(kind);
    if (!candidates.length) { this.error = `No compatible ${kind} assets are available`; return; }
    await this.attach([candidates[Math.floor(Math.random() * candidates.length)]], kind);
  }
  async attach(records: AssetRecord[], kind = this.picker) {
    if (!kind || !this.readFile || !records.length) return;
    const version = this.loadVersion;
    const request = ++this.companionVersion;
    try {
      if (kind === 'texture' && (records.length > 32 || records.reduce((sum, record) => sum + record.size, 0) > 32 * 1024 * 1024)) throw new Error('Select at most 32 textures totaling 32 MiB');
      const bytes: Uint8Array[] = [];
      for (const record of records) {
        bytes.push((await this.readFile(record.path)).subarray(record.offset || 0));
        if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) return;
      }
      if (kind === 'texture') this.textures = bytes;
      if (kind === 'texture') records.forEach((record, index) => this.captureTexture(bytes[index], this.key(record)));
      if (kind === 'model') this.model = decodeModel(bytes[0]);
      if (kind === 'animation') {
        this.animation = records[0].format === 'LMB' ? decodeLmb(bytes[0], (records[0].lmbType || 0) as LmbType) : decodeAnimation(bytes[0]);
        this.animationPath = this.key(records[0]); this.frame = 0; this.playing = false; this.durations = [];
        this.selectedAnimation = records[0];
      }
      this.picker = null; this.error = '';
      this.loadedCompanions[kind] = [...records];
      this.buildTexturePages(); this.cdr.detectChanges(); this.draw();
      if (kind !== 'texture') this.capturePreview(this.key(records[0]));
      this.capturePreview();
    } catch (error) { if (version === this.loadVersion && request === this.companionVersion) this.error = String(error); this.cdr.markForCheck(); }
  }
  captureTexture(bytes: Uint8Array, key: string) {
    try {
      const decoded = decodeTim(bytes);
      const canvas = document.createElement('canvas');
      canvas.width = decoded.width; canvas.height = decoded.height;
      canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(decoded.pixels), decoded.width, decoded.height), 0, 0);
      this.capturePreview(key, canvas);
    } catch { /* An unavailable thumbnail must not prevent companion selection. */ }
  }
  capturePreview(key = this.key(this.record), texture?: HTMLCanvasElement) {
    const version = this.loadVersion;
    queueMicrotask(() => {
      if (this.destroyed || version !== this.loadVersion) return;
      const source = texture || (this.image ? this.canvas?.nativeElement : this.stage?.snapshot());
      if (!source) return;
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 120;
      const scale = Math.min(160 / source.width, 120 / source.height);
      canvas.getContext('2d')?.drawImage(source, (160 - source.width * scale) / 2, (120 - source.height * scale) / 2, source.width * scale, source.height * scale);
      this.previewLoaded.emit({ key, url: canvas.toDataURL() });
    });
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
