import { EffectPreviewRuntime } from './asset-effect-runtime';
import { BattleBackdrop, decodeBattleBackdrop } from './asset-battle-stage';
import { effectSetupContext, EffectBattleSide } from './asset-effect-context';
import { buildEffectScene } from './asset-effect-scene';
import { SubmapComposition, decodeSubmapComposition, renderSubmapComposition, projectSubmapPoint } from './asset-submap';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { AssetRecord, AssetFormat, PREVIEW_FORMATS, assetCategory, gameIdentity } from './asset-catalog';
import { decodeTim, decodeMcq, texturePageFromTims, textureCoversPrimitive, submapTextureAtOrigin } from './asset-image';
import { decodeModel } from './asset-model';
import { decodeAnimation, decodeLmb, decodeAnm, decodeClutAnimationDetails, DecodedClutAnimation, LmbType } from './asset-animation';
import { copyPaletteRow } from './asset-palette';
import { decodeEnvironment, decodeCollision } from './asset-scene';
import { decodeSpuSample, listSpuSamples, encodeWav } from './asset-audio';
import { AssetCompanionPickerComponent, CompanionKind, companionFormats, companionResourceIncluded } from './asset-companion-picker.component';
import { ModelAsset, ModelAnimation, PixelImage, SceneOverlay, CollisionSelection, SpriteAnimation } from './asset-preview-types';
import { AssetStageComponent } from './asset-stage.component';

@Component({
  selector: 'app-asset-preview', imports: [FormsModule, JsonPipe, AssetStageComponent, AssetCompanionPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-preview.component.html', styleUrls: ['./asset-preview.component.css', './asset-playback.css'],
})
export class AssetPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  battleBackdrop: BattleBackdrop | null = null;
  showBattleBackdrop = true;
  get battleStagePreview() { return this.record?.battleStageId !== undefined && ['TMD', 'Animation'].includes(this.format); }
  @Input() bytes: Uint8Array = new Uint8Array();
  @Input() record!: AssetRecord;
  @Input() backgroundColor = '#18221c';
  @Input() backgroundPattern = true;
  brightness = 1;
  ambientStrength = 0.65;
  ambientColor = '#ffffff';
  mainLightColor = '#ffffff';
  get previewNotes(): string[] {
    return [...new Set([
      ...this.warnings,
      this.error,
      this.textureMappingWarning,
      ...(this.sceneResource ? this.submap?.warnings || [] : []),
      ...(this.record?.effectRuntime && this.format === 'LMB' ? this.runtimeDiagnostics : []),
      this.model && !this.animation && this.model.parts.length > 1 ? 'No pose loaded. Mesh parts may overlap at the origin. Choose a matching animation to assemble the model.' : '',
      this.model && !this.modelUsesTextures ? 'This model uses polygon colors and has no texture coordinates. Selecting textures will not change its surfaces.' : '',
      this.model && this.modelUsesTextures && !this.textures.length ? 'No textures loaded. Textured surfaces display without their image detail. Choose the companion textures.' : '',
      this.animation && !this.model ? 'Showing animation transforms as axes. Choose a matching model to see its animated mesh.' : '',
      this.sprite && !this.textures.length ? 'Choose a TIM texture to display the sprite animation.' : '',
      this.clut && !this.textures.length ? 'Choose a companion TIM to play the palette animation.' : '',
    ].filter(Boolean))];
  }
  adjustLighting(control: 'brightness' | 'ambientStrength', delta: number) {
    this[control] = Math.max(0, Math.min(control === 'brightness' ? 3 : 2, Math.round((this[control] + delta) * 100) / 100));
  }
  @Input() related: AssetRecord[] = [];
  @Input() assets: AssetRecord[] = [];
  @Input() thumbnails = new Map<string, string>();
  @Output() previewLoaded = new EventEmitter<{ key: string; url: string }>();
  @Output() navigateAsset = new EventEmitter<AssetRecord>();
  @Output() polygonSelected = new EventEmitter<CollisionSelection | null>();
  selectedPolygon: number | null = null;
  private pointerStart = { x: 0, y: 0 };
  loadedCompanions: Record<CompanionKind, AssetRecord[]> = { texture: [], model: [], animation: [] };
  picker: CompanionKind | null = null;
  readonly companionKinds: CompanionKind[] = ['texture', 'model', 'animation'];
  includeGameResources = false;
  includeSubmapResources = false;
  includeFieldEffects = false;
  get animationChoices() { return this.animations.filter(asset => companionResourceIncluded(asset, this.includeGameResources, this.includeSubmapResources, this.includeFieldEffects)); }
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
  get modelUsesTextures() { return !!this.model?.parts.some(part => part.primitives.some(primitive => primitive.uvs?.length)); }
  animation: ModelAnimation | null = null;
  sprite: SpriteAnimation | null = null;
  clut: DecodedClutAnimation | null = null;
  overlay: SceneOverlay | null = null;
  texturePages = new Map<string, PixelImage>();
  textureMappingWarning = '';
  textures: Uint8Array[] = [];
  palette = 0;
  imageZoom = 1;
  imagePanX = 0;
  imagePanY = 0;
  private imageDrag: { id: number; x: number; y: number } | null = null;
  get zoomableImage() { return this.format === 'TIM' || this.format === 'PNG' || this.format === 'MCQ' || (!!this.submap && this.sceneView !== 'geometry'); }
  get imageTransform() { return this.zoomableImage ? `translate(${this.imagePanX}px, ${this.imagePanY}px) scale(${this.imageZoom})` : null; }
  resetImageZoom() { this.imageZoom = 1; this.imagePanX = 0; this.imagePanY = 0; this.imageDrag = null; }
  zoomImage(event: WheelEvent) {
    if (!this.zoomableImage) return;
    event.preventDefault();
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
    const zoom = Math.max(0.1, Math.min(32, this.imageZoom * Math.exp(-delta * 0.002)));
    const ratio = zoom / this.imageZoom;
    this.imagePanX = x - (x - this.imagePanX) * ratio;
    this.imagePanY = y - (y - this.imagePanY) * ratio;
    this.imageZoom = zoom;
  }
  startImagePan(event: PointerEvent) {
    this.pointerStart = { x: event.clientX, y: event.clientY };
    if (!this.zoomableImage || event.button !== 0 || (event.target as Element).closest('button')) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.imageDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  moveImagePan(event: PointerEvent) {
    if (!this.imageDrag || this.imageDrag.id !== event.pointerId) return;
    this.imagePanX += event.clientX - this.imageDrag.x;
    this.imagePanY += event.clientY - this.imageDrag.y;
    this.imageDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  endImagePan(event: PointerEvent) {
    if (this.imageDrag?.id !== event.pointerId) return;
    this.imageDrag = null;
    const surface = event.currentTarget as HTMLElement;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
  }
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
  submap: SubmapComposition | null = null;
  environmentBytes: Uint8Array | null = null;
  sceneView: 'composition' | 'geometry' | 'both' = 'composition';
  hiddenLayers = new Set<number>();
  get sceneResource() { return this.format === 'Environment' || this.format === 'Collision' || this.format === 'CollisionInfo'; }
  get visibleCompanionKinds(): CompanionKind[] { return this.sceneResource ? ['texture'] : this.companionKinds; }
  updateSceneView() {
    this.image = this.submap && this.sceneView !== 'geometry' ? renderSubmapComposition(this.submap, this.hiddenLayers) : null;
    this.cdr.detectChanges();
    this.draw();
  }
  selectPolygon(index: number | null) {
    this.selectedPolygon = index;
    const polygon = index === null ? undefined : this.overlay?.polygons[index];
    this.polygonSelected.emit(polygon ? { index: index!, ...polygon, values: this.overlay?.records.find(record => record.label === `Collision primitive info ${index}`)?.values || {} } : null);
    this.draw();
  }
  pickComposition(event: MouseEvent) {
    if ((event.target as Element).closest('button') || this.sceneView !== 'both' || !this.overlay?.camera || !this.submap || Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 4) return;
    const canvas = this.canvas!.nativeElement, bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width, y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    let selected: number | null = null;
    this.overlay.polygons.forEach((polygon, index) => {
      const points = polygon.points.map(point => projectSubmapPoint(point, this.overlay!.camera!, this.submap!));
      if (points.some(point => !point)) return;
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i]!, b = points[j]!;
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      if (inside) selected = index;
    });
    this.selectPolygon(selected);
  }
  toggleLayer(index: number) {
    if (this.hiddenLayers.has(index)) this.hiddenLayers.delete(index);
    else this.hiddenLayers.add(index);
    this.updateSceneView();
  }
  private rebuildSubmap() {
    if (!this.environmentBytes) return;
    this.submap = decodeSubmapComposition(this.environmentBytes, this.textures);
    this.hiddenLayers = new Set();
    this.updateSceneView();
  }
  effectMode: 'runtime' | 'tracks' = 'runtime';
  effectSeed = 1;
  effectBattleSide: EffectBattleSide = 'player';
  effectScope: 'spell' | 'phase' = 'spell';
  followEffectCamera = true;
  private commonEffectTextures: Uint8Array[] = [];
  get hasEffectContext(): boolean {
    const metadata = this.record.effectRuntime;
    if (!metadata) return false;
    const start = metadata.program.starts[String(metadata.flags)][this.effectStart];
    return !!effectSetupContext(metadata, start, this.effectBattleSide, 'spell');
  }
  get hasEffectPhaseContext(): boolean {
    const metadata = this.record.effectRuntime;
    if (!metadata) return false;
    const start = metadata.program.starts[String(metadata.flags)][this.effectStart];
    return !!effectSetupContext(metadata, start, this.effectBattleSide, 'phase');
  }
  effectStart = 0;
  effectPreparing = false;
  runtimeInfo = '';
  runtimeDiagnostics: string[] = [];
  async runEffectPreview() {
    const metadata = this.record.effectRuntime;
    if (!metadata || !this.readFile) return;
    const version = this.loadVersion, request = ++this.companionVersion;
    this.effectPreparing = true;
    this.playing = false;
    this.runtimeInfo = '';
    this.runtimeDiagnostics = [];
    const read = async (path: string) => {
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) throw new Error('Effect preview superseded');
      const bytes = await this.readFile!(path);
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) throw new Error('Effect preview superseded');
      return bytes;
    };
    try {
      const script = await read(metadata.script);
      if (script.length > 4 * 1024 * 1024) throw new Error('Effect script exceeds 4 MiB limit');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(script)))].map(value => value.toString(16).padStart(2, '0')).join('');
      if (hash !== metadata.program.sha256) throw new Error('This script differs from the script-tool metadata. Rebuild the asset catalog for this SC extraction.');
      const start = metadata.program.starts[String(metadata.flags)][this.effectStart] ?? metadata.program.starts[String(metadata.flags)][0];
      if (this.effectScope === 'phase' && !effectSetupContext(metadata, start, this.effectBattleSide, 'phase') && effectSetupContext(metadata, start, this.effectBattleSide, 'spell')) this.effectScope = 'spell';
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) return;
      const context = effectSetupContext(metadata, start, this.effectBattleSide, this.effectScope);
      const result = new EffectPreviewRuntime(script, metadata.program, start, this.effectSeed, context).run();
      const scene = await buildEffectScene(result, metadata, read);
      if (context?.scene && !this.commonEffectTextures.length) {
        const textures: Uint8Array[] = [];
        let totalBytes = 0;
        for (let i = 0; i < 40; i++) {
          const texture = await read(`SECT/DRGN0.BIN/4114/3/${i}`);
          totalBytes += texture.length;
          if (totalBytes > 32 * 1024 * 1024) throw new Error('Common effect textures exceed 32 MiB');
          textures.push(texture);
        }
        this.commonEffectTextures = textures;
      }
      if (version !== this.loadVersion || request !== this.companionVersion || this.destroyed) return;
      this.model = scene.model.parts.length ? scene.model : null;
      this.animation = scene.model.parts.length ? scene.animation : decodeLmb(this.bytes, this.lmbType);
      this.runtimeDiagnostics = scene.warnings;
      if (result.diagnostics.some(note => note.startsWith('Script ')))
        this.runtimeDiagnostics.unshift('Partial preview: script setup stopped. Already-bound animation tracks continue; later setup and battle placement are unavailable.');
      if (!scene.model.parts.length) this.runtimeDiagnostics.push('This setup produced no renderable parts. Showing animation tracks.');
      this.runtimeInfo = `${result.frames.length} ticks · ${result.instructions} instructions · ${scene.model.parts.length} render parts`;
      if (context) this.runtimeInfo = `${context.label} · ${this.runtimeInfo}`;
      this.loadedCompanions.model = scene.resources.filter(resource => resource.kind === 'TMD').map(resource => this.reference(resource.path, 'TMD', 0, resource.offset));
      this.frame = scene.model.parts.length ? Math.max(0, scene.animation.frames.findIndex(frame => frame.some(part => part.visible !== false && part.colour?.some(value => value > 0)))) : 0;
      this.durations = [];
      this.playbackFps = this.nativeFps;
      this.buildTexturePages();
      this.error = '';
      this.cdr.detectChanges();
      this.capturePreview();
    } catch (error) {
      if (version === this.loadVersion && request === this.companionVersion) this.error = `Effect runtime: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      if (version === this.loadVersion && request === this.companionVersion) this.effectPreparing = false;
      this.cdr.markForCheck();
    }
  }
  changeEffectMode() {
    if (this.effectMode === 'runtime') { void this.runEffectPreview(); return; }
    ++this.companionVersion;
    this.effectPreparing = false;
    this.playing = false;
    this.frame = 0;
    this.runtimeInfo = '';
    this.runtimeDiagnostics = [];
    this.error = '';
    this.model = null;
    this.loadedCompanions.model = [];
    this.animation = decodeLmb(this.bytes, this.lmbType);
    this.durations = [];
    this.playbackFps = this.nativeFps;
  }
  async load() {
    this.battleBackdrop = null;
    this.showBattleBackdrop = true;
    this.effectMode = 'runtime';
    this.effectPreparing = false;
    this.effectStart = 0;
    this.runtimeInfo = '';
    this.runtimeDiagnostics = [];
    this.selectedPolygon = null;
    this.polygonSelected.emit(null);
    this.submap = null;
    this.environmentBytes = null;
    this.sceneView = 'composition';
    this.hiddenLayers = new Set();
    this.resetImageZoom();
    const version = ++this.loadVersion; this.picker = null; this.selectedAnimation = null;
    ++this.companionVersion;
    this.loadedCompanions = { texture: [], model: [], animation: [] };
    this.textureMappingWarning = '';
    this.playing = false; this.frame = 0; this.loading = true; this.error = ''; this.warnings = [];
    this.image = null; this.model = null; this.animation = null; this.sprite = null; this.clut = null; this.overlay = null;
    this.texturePages = new Map(); this.textures = []; this.commonEffectTextures = []; this.palette = 0; this.samples = []; this.animationPath = ''; this.showRecords = false;
    if (this.mediaUrl) URL.revokeObjectURL(this.mediaUrl);
    this.mediaUrl = '';
    try {
      const textures: Uint8Array[] = [];
      let textureSize = 0;
      if (this.readFile && !['PNG', 'Opus', 'SPU', 'TIM', 'MCQ', 'Unknown'].includes(this.format)) {
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
          if (this.format === 'LMB' && !this.record.model && this.record.effectRuntime) await this.runEffectPreview();
          if (version !== this.loadVersion || this.destroyed) return;
          break;
        }
        case 'ANM': this.sprite = decodeAnm(this.bytes); this.loadedCompanions.animation = [this.record]; this.warnings.push(...this.sprite.warnings); break;
        case 'Environment': case 'Collision': case 'CollisionInfo': {
          this.environmentBytes = this.format === 'Environment' ? this.bytes : null;
          let environment: SceneOverlay | null = this.format === 'Environment' ? decodeEnvironment(this.bytes) : null;
          let collision: SceneOverlay | null = this.format === 'Collision' ? decodeCollision(this.bytes) : null;
          if (this.readFile) {
            try {
              const envBytes = this.record.environment ? await this.readFile(this.record.environment) : null;
              const colBytes = this.record.collision ? await this.readFile(this.record.collision) : null;
              const infoBytes = this.format === 'CollisionInfo' ? this.bytes : this.record.collisionInfo ? await this.readFile(this.record.collisionInfo) : undefined;
              if (version !== this.loadVersion || this.destroyed) return;
              if (envBytes) {
                environment = decodeEnvironment(envBytes);
                this.environmentBytes = envBytes;
              }
              if (colBytes || this.format === 'Collision') collision = decodeCollision(colBytes || this.bytes, infoBytes);
            } catch { if (version === this.loadVersion) this.warnings.push('Some companion scene resources could not be loaded'); }
          }
          this.overlay = { format: 'Environment & collision', camera: environment?.camera, polygons: collision?.polygons || [], records: [...(environment?.records || []), ...(collision?.records || [])], warnings: [...(environment?.warnings || []), ...(collision?.warnings || [])] };
          this.warnings.push(...this.overlay.warnings);
          if (!this.environmentBytes) this.sceneView = 'geometry'; break;
        }
        case 'CLUT': {
          this.clut = decodeClutAnimationDetails(this.bytes);
          this.overlay = { format: 'Palette animation', polygons: [], records: this.clut.steps.map((step, i) => ({ label: `Frame ${i}`, values: { sourceRow: step.sourceYOffset, duration: step.durationTicks, targetRow: this.clut!.targetClutIndex } })), warnings: this.clut.warnings };
          this.showRecords = true; this.warnings.push(...this.clut.warnings); break;
        }
        default: this.error = 'This resource is not recognized. Choose a format to inspect it.';
      }
      if (this.battleStagePreview) {
        this.warnings.push('Battle stage preview uses the arena’s initial orientation and camera-scrolling backdrop. Encounter camera scripts, animated palette effects, and stage-specific lighting are not simulated.');
        if (this.record.backdrop && this.readFile) {
          try {
            const backdrop = await this.readFile(this.record.backdrop);
            if (version !== this.loadVersion || this.destroyed) return;
            this.battleBackdrop = decodeBattleBackdrop(backdrop);
          } catch {
            if (version === this.loadVersion) this.warnings.push(`Background ${this.record.backdrop} could not be loaded`);
          }
        }
        if (version !== this.loadVersion || this.destroyed) return;
      }
      this.buildTexturePages();
      this.playbackFps = this.nativeFps;
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
    if (this.sceneResource) this.rebuildSubmap();
    const pages = new Map<string, PixelImage>();
    const decoded = new Map<string, ReturnType<typeof texturePageFromTims>>();
    const missing = new Set<string>();
    this.textureMappingWarning = '';
    if (this.textures.length) {
      const modelRecord = this.loadedCompanions.model[0];
      const submap = modelRecord && /^(SECT\/DRGN2[1-4]\.BIN\/\d+)\/(\d+)$/.exec(modelRecord.path);
      const relocateSubmap = !!submap && this.textures.length === 1 && this.loadedCompanions.texture[0]?.path === `${submap[1]}/textures/${Math.floor(Number(submap[2]) / 33)}`;
      const modelTextures = relocateSubmap ? [submapTextureAtOrigin(this.textures[0])] : [...(this.effectMode === 'runtime' && this.effectScope === 'spell' ? this.commonEffectTextures : []), ...this.textures];
      for (const primitive of this.model?.parts.flatMap(part => part.primitives) || []) {
        if (primitive.clut === undefined || primitive.tpage === undefined) continue;
        const key = `${primitive.clut}:${primitive.tpage}`;
          const clut = relocateSubmap ? (primitive.clut & 0x3c3) | (112 << 6) : primitive.clut;
          const tpage = relocateSubmap ? primitive.tpage & 0xffe0 : primitive.tpage;
          if (!decoded.has(key) && decoded.size < 256) decoded.set(key, texturePageFromTims(modelTextures, clut, tpage));
          const page = decoded.get(key);
          if (page && primitive.uvs && !textureCoversPrimitive(page.coverage, primitive.uvs)) missing.add(key);
          if (page) pages.set(key, page);
      }
      for (const frame of this.sprite?.frames || []) for (const piece of frame.pieces) {
        const key = `${piece.clut}:${piece.tpage}`;
        if (!pages.has(key) && pages.size < 256) pages.set(key, texturePageFromTims(this.textures, piece.clut, this.record.path.startsWith('SUBMAP/savepoint/') ? 31 : piece.tpage));
      }
    }
    for (const key of missing) pages.delete(key);
    if (missing.size) this.textureMappingWarning = `Selected textures do not cover ${missing.size} texture/palette mappings used by this model. Affected surfaces are shown without textures. Choose the model's companion texture set.`;
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
      this.playbackFps = this.nativeFps;
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
    return this.assets.filter(asset => formats.includes(asset.format) && companionResourceIncluded(asset, this.includeGameResources, this.includeSubmapResources, this.includeFieldEffects) && (kind !== 'texture' || asset.size <= 32 * 1024 * 1024));
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
    this.effectPreparing = false;
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
      if (kind === 'model') {
        if (this.effectMode === 'runtime') {
          this.animation = undefined;
          this.frame = 0;
          this.playing = false;
          this.runtimeInfo = '';
          this.runtimeDiagnostics = [];
        }
        this.effectMode = 'tracks';
        this.model = decodeModel(bytes[0]);
      }
      if (kind === 'animation') {
        this.effectMode = 'tracks';
        this.animation = records[0].format === 'LMB' ? decodeLmb(bytes[0], (records[0].lmbType || 0) as LmbType) : decodeAnimation(bytes[0]);
        this.animationPath = this.key(records[0]); this.frame = 0; this.playing = false; this.durations = [];
        this.selectedAnimation = records[0];
        this.playbackFps = this.nativeFps;
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
  playbackFps = 30;
  get nativeFps() { return this.animation?.fps || this.sprite?.fps || 30; }
  get frameDurationMs() { return (this.durations[this.frame] || 1 / this.nativeFps) * 1000 * this.nativeFps / this.playbackFps; }
  setPlaybackFps(value: number) {
    this.playbackFps = Math.max(1, Math.min(120, Number(value) || this.nativeFps));
    this.lastTick = performance.now();
  }
  togglePlayback() {
    this.endFrameDrag();
    this.playing = !this.playing;
    cancelAnimationFrame(this.raf);
    if (!this.playing) return;
    this.lastTick = performance.now();
    const tick = (now: number) => {
      if (!this.playing || this.destroyed) return;
      const duration = this.frameDurationMs;
      if (now - this.lastTick >= duration) {
        this.lastTick = now;
        this.zone.run(() => {
          this.frame = (this.frame + 1) % this.frameCount;
          this.draw();
          // Render the transport and stage inputs on this tick, without waiting for UI events.
          this.cdr.detectChanges();
        });
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.zone.runOutsideAngular(() => { this.raf = requestAnimationFrame(tick); });
  }
  stepFrame(direction: -1 | 1) {
    this.frame = Math.max(0, Math.min(this.frameCount - 1, Number(this.frame) + direction));
    this.scrub();
  }
  private frameDrag: { id: number; input: HTMLInputElement } | null = null;
  startFrameDrag(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.endFrameDrag();
    const input = event.currentTarget as HTMLInputElement;
    input.focus();
    input.setPointerCapture(event.pointerId);
    this.frameDrag = { id: event.pointerId, input };
    this.moveFrameDrag(event);
  }
  moveFrameDrag(event: PointerEvent) {
    if (!this.frameDrag || this.frameDrag.id !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      this.endFrameDrag();
      return;
    }
    const rect = this.frameDrag.input.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left - 11) / Math.max(1, rect.width - 22)));
    this.frame = Math.round(fraction * Math.max(0, this.frameCount - 1));
    this.scrub();
  }
  endFrameDrag() {
    const drag = this.frameDrag;
    this.frameDrag = null;
    if (drag?.input.hasPointerCapture(drag.id)) drag.input.releasePointerCapture(drag.id);
  }
  scrubFrameInput(event: Event) {
    this.frame = Number((event.target as HTMLInputElement).value);
    this.scrub();
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
      if (this.sceneView === 'both' && this.submap && this.overlay?.camera) {
        context.strokeStyle = '#b8ed83';
        context.lineWidth = 0.8;
        for (const [index, polygon] of this.overlay.polygons.entries()) {
          context.strokeStyle = index === this.selectedPolygon ? '#ffcc55' : '#b8ed83';
          context.lineWidth = index === this.selectedPolygon ? 2 : 0.8;
          const points = polygon.points.map(point => projectSubmapPoint(point, this.overlay!.camera!, this.submap!));
          context.beginPath();
          for (let i = 0; i < points.length; i++) {
            const a = points[i], b = points[(i + 1) % points.length];
            if (!a || !b) continue;
            context.moveTo(a[0], a[1]);
            context.lineTo(b[0], b[1]);
          }
          context.stroke();
        }
      }
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
