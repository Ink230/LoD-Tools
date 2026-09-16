import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { AssetStageComponent } from './asset-stage.component';

describe('battle stage preview lighting', () => {
  it('lights baked arena faces with generated normals while retaining unlit effect materials', () => {
    const fixture = TestBed.createComponent(AssetStageComponent);
    const stage = fixture.componentInstance;
    stage.model = { format: 'TMD', warnings: [], parts: [{ vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]], normals: [], primitives: [{ indices: [0, 1, 2], colors: [[128, 128, 128]], unlit: true }] }] };
    try {
      stage.battleStage = true;
      stage['rebuild']();
      const mesh = stage['parts'][0].children[0] as THREE.Mesh;
      expect(mesh.material).toBeInstanceOf(THREE.MeshLambertMaterial);
      expect(mesh.geometry.getAttribute('normal').getZ(0)).toBe(-1);
      stage.mainLightColor = '#ff0000';
      stage.ambientColor = '#00ff00';
      stage.ambientStrength = 1.5;
      stage.ngOnChanges();
      expect(stage['mainLight'].color.getHexString()).toBe('ff0000');
      expect(stage['ambientLight'].color.getHexString()).toBe('00ff00');
      expect(stage['ambientLight'].intensity).toBe(1.5);
      stage.battleStage = false;
      stage['rebuild']();
      expect((stage['parts'][0].children[0] as THREE.Mesh).material).toBeInstanceOf(THREE.MeshBasicMaterial);
    } finally { fixture.destroy(); }
  });
});
