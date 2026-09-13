import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TerrainGuide {
  region: string;
  image: string;
  x: number;
  z: number;
  width: number;
  height: number;
  rotation?: number;
}

export function validGuide(value: unknown): value is TerrainGuide {
  if (!value || typeof value !== 'object') return false;
  const guide = value as TerrainGuide;
  return (
    typeof guide.region === 'string' &&
    typeof guide.image === 'string' &&
    [guide.x, guide.z, guide.width, guide.height, guide.rotation ?? 0].every(Number.isFinite) &&
    guide.width > 0 &&
    guide.height > 0
  );
}

export function guideTransform(guide: TerrainGuide): string {
  return `rotate(${guide.rotation ?? 0} ${guide.x + guide.width / 2} ${guide.z + guide.height / 2})`;
}

@Component({
  selector: 'app-world-map-terrain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './world-map-terrain.component.html',
  styleUrl: './world-map-terrain.component.css',
})
export class WorldMapTerrainComponent implements OnInit {
  @Input() region = '';
  @Input() view = { x: 0, z: 0, width: 1000, height: 700 };
  private readonly detector = inject(ChangeDetectorRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  @HostListener('document:pointerdown', ['$event'])
  closeOutside(event: PointerEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
  @HostListener('keydown.escape')
  close() {
    this.host.nativeElement.querySelector('details')?.removeAttribute('open');
  }
  private readonly storageKey = 'lodtools.world-map.terrain-guides.v1';
  native: TerrainGuide[] = [];
  custom: TerrainGuide[] = [];
  visible = true;
  opacity = 0.8;
  message = '';
  readonly fields = ['x', 'z', 'width', 'height', 'rotation'] as const;

  get customGuide() {
    return this.custom.find((guide) => guide.region === this.region);
  }
  get active(): TerrainGuide | undefined {
    return this.region ? (this.customGuide ?? this.native.find((guide) => guide.region === this.region)) : undefined;
  }
  get transform() {
    return this.active ? guideTransform(this.active) : '';
  }

  async ngOnInit() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      if (Array.isArray(saved)) this.custom = saved.filter(validGuide).filter((guide) => /^data:image\/(png|jpeg|webp);base64,/.test(guide.image));
    } catch {
      this.message = 'Browser guide storage is unavailable';
    }
    try {
      const response = await fetch('assets/world-map/terrain/index.json');
      if (!response.ok) throw new Error('unavailable');
      const manifest = await response.json();
      this.native = Array.isArray(manifest.guides) ? manifest.guides.filter(validGuide) : [];
    } catch {
      this.message = 'Native terrain unavailable; import a guide image';
    }
    this.detector.markForCheck();
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.custom));
      this.message = 'Custom guides saved in this browser';
    } catch {
      this.message = 'Guide works this session, but browser storage is full or unavailable';
    }
  }

  update(field: (typeof this.fields)[number], value: number) {
    const guide = this.customGuide;
    if (!guide || !Number.isFinite(value) || ((field === 'width' || field === 'height') && value <= 0)) return;
    guide[field] = value;
    this.save();
  }

  remove() {
    this.custom = this.custom.filter((guide) => guide.region !== this.region);
    this.save();
  }

  async importImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const region = this.region;
    input.value = '';
    if (!file || !region) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      this.message = 'Choose a PNG, JPEG or WebP image up to 3 MB';
      return;
    }
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Cannot read image'));
        reader.readAsDataURL(file);
      });
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const bitmap = new Image();
        bitmap.onload = () => resolve({ width: bitmap.naturalWidth, height: bitmap.naturalHeight });
        bitmap.onerror = () => reject(new Error('Cannot decode image'));
        bitmap.src = image;
      });
      const width = this.view.width;
      this.custom = [
        ...this.custom.filter((guide) => guide.region !== region),
        { region, image, x: this.view.x, z: this.view.z, width, height: (width * dimensions.height) / dimensions.width, rotation: 0 },
      ];
      this.save();
    } catch (error) {
      this.message = String(error);
    }
    this.detector.markForCheck();
  }
}
