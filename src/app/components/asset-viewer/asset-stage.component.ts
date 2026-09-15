import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, Input, NgZone, OnChanges, OnDestroy, ViewChild, inject } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelAsset, ModelAnimation, PixelImage, SceneOverlay } from './asset-preview-types';

@Component({
  selector: 'app-asset-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div #surface (pointerdown)="beginPick($event)" (pointerup)="pickPolygon($event)" class="surface" aria-label="3D asset viewport"></div>',
  styles: [':host { display:block; height:100%; min-height:360px; } .surface { width:100%; height:100%; min-height:360px; }'],
})
export class AssetStageComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('surface') surface!: ElementRef<HTMLDivElement>;
  @Input() model: ModelAsset | null = null;
  @Input() animation: ModelAnimation | null = null;
  @Input() overlay: SceneOverlay | null = null;
  @Input() frame = 0;
  @Input() effectBackdrop = false;
  @Input() followEffectCamera = true;
  @Input() selectedPolygon: number | null = null;
  @Output() polygonSelected = new EventEmitter<number | null>();
  private pickStart = { x: 0, y: 0 };
  beginPick(event: PointerEvent) { this.pickStart = { x: event.clientX, y: event.clientY }; }
  pickPolygon(event: PointerEvent) {
    if (event.button !== 0 || !this.overlay?.polygons.length || Math.hypot(event.clientX - this.pickStart.x, event.clientY - this.pickStart.y) > 4) return;
    const bounds = this.surface.nativeElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), this.camera);
    const hits = ray.intersectObjects(this.root.children.filter(object => object.userData['collisionPick']), false);
    this.polygonSelected.emit(hits.length ? hits[0].object.userData['polygonIndex'] : null);
  }
  @Input() wireframe = false;
  @Input() texturePages = new Map<string, PixelImage>();
  private readonly zone = inject(NgZone);
  private renderer?: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly flashScene = new THREE.Scene();
  private readonly flashCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly flashGeometry = new THREE.PlaneGeometry(2, 2);
  private readonly flashMaterial = new THREE.MeshBasicMaterial({ color: 0, blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1e7);
  private readonly root = new THREE.Group();
  private parts: THREE.Group[] = [];
  private controls?: OrbitControls;
  private resize?: ResizeObserver;
  private disposed = false;
  private previousModel: ModelAsset | null = null;
  private previousOverlay: SceneOverlay | null = null;
  private previousPages = this.texturePages;
  private previousAnimation: ModelAnimation | null = null;

  ngAfterViewInit() {
    this.scene.background = this.effectBackdrop ? new THREE.Color('#949ca8') : null;
    const flash = new THREE.Mesh(this.flashGeometry, this.flashMaterial);
    flash.position.z = -0.5;
    this.flashScene.add(flash);
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.surface.nativeElement.appendChild(this.renderer.domElement);
      this.root.scale.set(1, -1, -1);
      this.scene.add(this.root);
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.addEventListener('change', () => this.render());
      this.resize = new ResizeObserver(() => this.render());
      this.resize.observe(this.surface.nativeElement);
      this.rebuild();
    } catch {
      this.surface.nativeElement.textContent = 'The 3D preview requires WebGL. Enable hardware acceleration and reload.';
    }
  }
  ngOnChanges() {
    this.scene.background = this.effectBackdrop ? new THREE.Color('#949ca8') : null;
    if (!this.renderer) return;
    if (this.previousModel !== this.model || this.previousOverlay !== this.overlay || this.previousPages !== this.texturePages || (!this.model && this.previousAnimation !== this.animation)) this.rebuild();
    else this.pose();
  }
  private clear() {
    this.root.traverse(object => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
      for (const material of materials) {
        (material as THREE.MeshBasicMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.root.clear();
    this.parts = [];
  }
  private rebuild() {
    this.clear();
    this.previousModel = this.model;
    this.previousOverlay = this.overlay;
    this.previousPages = this.texturePages;
    this.previousAnimation = this.animation;
    for (const part of this.model?.parts || []) {
      const group = new THREE.Group();
      this.parts.push(group); this.root.add(group);
      // Batch primitives by PSX texture page, palette and translucency rather than one draw per polygon.
      const batches = new Map<string, typeof part.primitives>();
      for (const primitive of part.primitives) {
        const key = `${primitive.clut ?? -1}:${primitive.tpage ?? -1}:${primitive.translucent ? 1 : 0}`;
        const batch = batches.get(key) || [];
        batch.push(primitive); batches.set(key, batch);
      }
      for (const batch of batches.values()) {
        const positions: number[] = [], colors: number[] = [], uvs: number[] = [];
        const first = batch[0];
        const page = this.texturePages.get(`${first.clut}:${first.tpage}`);
        for (const primitive of batch) {
          const triangles = primitive.indices.length === 4 ? [2, 1, 0, 1, 2, 3] : [2, 1, 0];
          for (const index of triangles) {
            const vertex = part.vertices[primitive.indices[index]];
            if (!vertex) continue;
            positions.push(...vertex);
            const color = primitive.colors[index] || primitive.colors[0] || [128, 128, 128];
            colors.push(...color.map(channel => channel * (page ? 2 / 255 : 1 / 255)));
            const uv = primitive.uvs?.[index] || [0, 0];
            uvs.push((uv[0] + 0.5) / 256, (uv[1] + 0.5) / 256);
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        const makeTexture = (semiPass: boolean) => {
          if (!page) return null;
          const pixels = new Uint8Array(page.pixels);
          for (let i = 3; i < pixels.length; i += 4) {
            const alpha = pixels[i];
            pixels[i] = first.translucent ? (semiPass ? (alpha === 128 ? 255 : 0) : (alpha === 255 ? 255 : 0)) : (alpha ? 255 : 0);
          }
          const texture = new THREE.DataTexture(pixels, page.width, page.height);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.needsUpdate = true;
          return texture;
        };
        if (page || !first.translucent) {
          const material = new THREE.MeshBasicMaterial({ map: makeTexture(false), vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.01, wireframe: this.wireframe });
          group.add(new THREE.Mesh(geometry, material));
        }
        if (first.translucent) {
          const mode = ((first.tpage || 0) >> 5) & 3;
          const material = new THREE.MeshBasicMaterial({ map: makeTexture(true), vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.01, transparent: true, depthWrite: false, wireframe: this.wireframe });
          material.blending = THREE.CustomBlending;
          material.blendEquation = mode === 2 ? THREE.ReverseSubtractEquation : THREE.AddEquation;
          material.blendSrc = mode === 0 || mode === 3 ? THREE.ConstantAlphaFactor : THREE.OneFactor;
          material.blendDst = mode === 0 ? THREE.OneMinusConstantAlphaFactor : THREE.OneFactor;
          material.blendAlpha = mode === 3 ? 0.25 : 0.5;
          material.blendEquationAlpha = THREE.AddEquation; material.blendSrcAlpha = THREE.OneFactor; material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
          group.add(new THREE.Mesh(geometry, material));
        }
      }
    }
    if (!this.model && this.animation?.frames[0]) {
      for (let i = 0; i < this.animation.frames[0].length; i++) {
        const group = new THREE.Group(); group.add(new THREE.AxesHelper(40)); this.parts.push(group); this.root.add(group);
      }
    }
    if (this.overlay) {
      for (const [index, polygon] of this.overlay.polygons.entries()) {
        if (polygon.points.length < 2) continue;
        const points = [...polygon.points, polygon.points[0]].map(point => new THREE.Vector3(...point));
                const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xa4d77b }));
        line.userData['polygonIndex'] = index;
        this.root.add(line);
        const positions: number[] = [];
        for (let i = 1; i + 1 < polygon.points.length; i++) positions.push(...polygon.points[0], ...polygon.points[i], ...polygon.points[i + 1]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false }));
        mesh.userData['collisionPick'] = true;
        mesh.userData['polygonIndex'] = index;
        this.root.add(mesh);
      }
      if (this.overlay.camera) {
        const data = this.overlay.camera;
        const camera = new THREE.PerspectiveCamera(2 * Math.atan(120 / Math.max(1, data.projectionDistance)) * 180 / Math.PI, 4 / 3, 10, 500);
        // RetailSubmap shifts degrees by 12; Graphics divides by 360 before PSX-angle conversion.
        camera.position.set(...data.position); camera.up.set(0, -1, 0); camera.lookAt(...data.target); camera.rotateZ(data.rotation * Math.PI / 180); camera.updateMatrixWorld();
        this.root.add(new THREE.CameraHelper(camera));
      }
    }
    this.pose(); this.fit();
  }
  private pose() {
    for (const object of this.root.children) {
      if (object instanceof THREE.Line && object.userData['polygonIndex'] !== undefined) (object.material as THREE.LineBasicMaterial).color.setHex(object.userData['polygonIndex'] === this.selectedPolygon ? 0xffcc55 : 0xa4d77b);
    }
    const transforms = this.animation?.frames[Math.floor(this.frame) % this.animation.frames.length];
    for (let i = 0; i < this.parts.length; i++) {
      const transform = transforms?.[i];
      this.parts[i].visible = transform?.visible !== false;
      this.parts[i].userData['billboardRotation'] = transform?.rotation[2] || 0;
      this.parts[i].userData['screenRotation'] = transform?.screenRotation;
      this.parts[i].traverse(object => {
        const material = (object as THREE.Mesh).material;
        if (material instanceof THREE.MeshBasicMaterial) material.color.setRGB(...((transform?.colour || [128, 128, 128]).map(value => value / 128) as [number, number, number]));
      });
      this.parts[i].position.set(...(transform?.translation || [0, 0, 0]));
      this.parts[i].rotation.set(...(transform?.rotation || [0, 0, 0]), 'ZYX');
      this.parts[i].scale.set(...(transform?.scale || [1, 1, 1]));
    }
    this.root.traverse(object => {
      const material = (object as THREE.Mesh).material;
      if (material instanceof THREE.MeshBasicMaterial && !object.userData['collisionPick']) material.wireframe = this.wireframe;
    });
    this.applyEffectCamera();
    this.render();
  }
  private applyEffectCamera(): boolean {
    const pose = this.followEffectCamera && this.animation?.cameras?.[Math.floor(this.frame)];
    if (!pose || !this.controls) return false;
    this.camera.position.set(...pose.position).multiply(this.root.scale);
    this.controls.target.set(...pose.target).multiply(this.root.scale);
    this.camera.near = 1;
    this.camera.far = 100000;
    this.controls.update();
    return true;
  }
  fit() {
    if (!this.controls) return;
    if (this.applyEffectCamera()) { this.render(); return; }
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.root);
    if (this.animation?.format === 'Effect runtime') {
      const radii = this.model!.parts.map(part => part.vertices.reduce((radius, vertex) => Math.max(radius, Math.hypot(...vertex)), 1));
      for (const frame of this.animation.frames) frame.forEach((part, index) => {
        if (part.visible === false) return;
        const radius = radii[index] * Math.max(...part.scale.map(Math.abs));
        const center = new THREE.Vector3(...part.translation).multiply(this.root.scale);
        box.expandByPoint(center.clone().addScalar(radius));
        box.expandByPoint(center.clone().addScalar(-radius));
      });
    }
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const extent = Math.max(100, box.isEmpty() ? 100 : box.getSize(new THREE.Vector3()).length());
    this.camera.near = Math.max(0.01, extent / 10000); this.camera.far = extent * 100;
    this.camera.position.copy(center).add(new THREE.Vector3(extent * 0.5, extent * 0.25, extent));
    this.controls.target.copy(center); this.controls.update(); this.render();
  }
  snapshot(): HTMLCanvasElement | undefined {
    this.render();
    return this.renderer?.domElement;
  }
  private render() {
    if (!this.renderer || this.disposed) return;
    this.zone.runOutsideAngular(() => {
      const { clientWidth: width, clientHeight: height } = this.surface.nativeElement;
      if (!width || !height) return;
      this.renderer!.setSize(width, height, false);
      this.renderer!.domElement.style.width = '100%'; this.renderer!.domElement.style.height = '100%';
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
      for (let i = 0; i < this.parts.length; i++) {
        if (!this.model?.parts[i]?.billboard && !this.parts[i].userData['screenRotation']) continue;
        this.parts[i].quaternion.copy(this.root.getWorldQuaternion(new THREE.Quaternion()).invert()).multiply(this.camera.getWorldQuaternion(new THREE.Quaternion()));
        const rotation = this.parts[i].userData['screenRotation'] as [number, number, number] | undefined;
        if (rotation) this.parts[i].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation, 'XYZ')));
        else this.parts[i].rotateZ(this.parts[i].userData['billboardRotation'] || 0);
      }
      this.renderer!.render(this.scene, this.camera);
      const flash = this.animation?.flashes?.[Math.floor(this.frame)];
      if (flash?.some(value => value > 0)) {
        this.flashMaterial.color.setRGB(...flash.map(value => Math.max(0, Math.min(255, value)) / 255) as [number, number, number]);
        this.renderer!.autoClear = false;
        this.renderer!.render(this.flashScene, this.flashCamera);
        this.renderer!.autoClear = true;
      }
    });
  }
  ngOnDestroy() { this.flashGeometry.dispose(); this.flashMaterial.dispose(); this.disposed = true; this.resize?.disconnect(); this.controls?.dispose(); this.clear(); this.renderer?.dispose(); }
}
