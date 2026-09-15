import { AssetFormat, AssetRecord, assetCategory, gameIdentity } from './asset-catalog';

export interface EntityLinkGroup { label: string; assets: AssetRecord[]; }

/** Source relationships only; temporary preview attachments never modify these records. */
export function entityLinks(entity: AssetRecord, catalog: AssetRecord[]): EntityLinkGroup[] {
  const resolve = (path: string, format: AssetFormat, offset = 0): AssetRecord =>
    catalog.find(asset => asset.path === path && asset.format === format && (asset.offset || 0) === offset)
    || { path, format, offset, name: path.split('/').at(-1) || path, size: 0, category: assetCategory(format), ...gameIdentity(path) };
  const model = entity.format === 'TMD' ? entity : entity.model ? resolve(entity.model, 'TMD', entity.modelOffset || 0) : null;
  const animations = model ? catalog.filter(asset => ['Animation', 'CMB', 'LMB', 'CLUT'].includes(asset.format) && asset.model === model.path && (asset.modelOffset || 0) === (model.offset || 0)) : [];
  if (['Animation', 'CMB', 'LMB', 'ANM', 'CLUT'].includes(entity.format) && !animations.some(asset => asset.path === entity.path && (asset.offset || 0) === (entity.offset || 0))) animations.unshift(entity);
  return [
    { label: 'Effect models', assets: [...new Map((entity.lmbSetup?.slots.flatMap(slot => slot.options) || []).map(option => [option.path + '@' + option.offset, resolve(option.path, 'TMD', option.offset)])).values()] },
    { label: 'Effect setup script', assets: entity.lmbSetup ? [resolve(entity.lmbSetup.script, 'Unknown')] : [] },
    { label: 'Textures', assets: (entity.textures || []).map(path => resolve(path, 'TIM')) },
    { label: 'Model', assets: model ? [model] : [] },
    { label: 'Animations', assets: animations },
    { label: 'Environment', assets: entity.environment ? [resolve(entity.environment, 'Environment')] : [] },
    { label: 'Collision', assets: entity.collision ? [resolve(entity.collision, 'Collision')] : [] },
    { label: 'Collision information', assets: entity.collisionInfo ? [resolve(entity.collisionInfo, 'CollisionInfo')] : [] },
  ].filter(group => group.assets.length);
}
