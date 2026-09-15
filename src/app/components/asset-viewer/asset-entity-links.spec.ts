import { describe, expect, it } from 'vitest';
import { AssetRecord } from './asset-catalog';
import { entityLinks } from './asset-entity-links';

const record = (path: string, format: AssetRecord['format'], offset = 0): AssetRecord => ({ path, format, offset, name: path, size: 32, category: 'models', gameCategory: 'party', gameAsset: 'Dart' });

describe('entity source attachments', () => {
  it('resolves texture and model links and matches animations by embedded model offset', () => {
    const texture = record('texture', 'TIM');
    const model = { ...record('package', 'TMD', 40), textures: ['texture'] };
    const animation = { ...record('package', 'CMB', 200), model: 'package', modelOffset: 40 };
    const other = { ...record('package', 'CMB', 400), model: 'package', modelOffset: 300 };
    const links = entityLinks(model, [texture, model, animation, other]);
    expect(links).toEqual([
      { label: 'Textures', assets: [texture] },
      { label: 'Model', assets: [model] },
      { label: 'Animations', assets: [animation] },
    ]);
    expect(entityLinks(animation, [model, animation])[0]).toEqual({ label: 'Model', assets: [model] });
  });

  it('keeps unresolved source references navigable without copying unrelated companions', () => {
    const entity = { ...record('animation', 'CMB'), model: 'missing/model', modelOffset: 24, textures: ['missing/texture'] };
    const links = entityLinks(entity, []);
    expect(links[0].assets[0].path).toBe('missing/texture');
    expect(links[1].assets[0]).toMatchObject({ path: 'missing/model', offset: 24, format: 'TMD' });
    expect(links[1].assets[0].textures).toBeUndefined();
  });
});
