export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  entries: { name: string; description: string }[];
}

export const FORMAT_CATEGORIES: AssetCategory[] = [
  { id: 'images', name: 'Images & textures', description: 'Texture images, palettes, backgrounds, and interface artwork.', entries: [
    { name: 'TIM', description: 'Texture images and palettes for models, fonts, and sprites' },
    { name: 'PXL', description: 'Packed submap texture pages, extracted by SC into TIM textures' },
    { name: 'MCQ', description: 'Battle backdrops, world-map imagery, and full-screen artwork' },
    { name: 'PNG', description: 'Extracted character portraits, Dragoon Spirit icons, and interface artwork' },
  ] },
  { id: 'models', name: 'Models & animations', description: 'Geometry, model motion, sprite sequences, and palette animation.', entries: [
    { name: 'TMD / CTMD', description: 'Model geometry, including models decompressed by SC' },
    { name: 'CContainer', description: 'Model containers with auxiliary animation data' },
    { name: 'Model animation', description: 'Standard frame-based model-part transforms' },
    { name: 'CMB', description: 'Compressed model animation' },
    { name: 'LMB', description: 'Multi-object animation in types 0, 1, and 2' },
    { name: 'ANM', description: 'Sprite groups and animation sequences' },
    { name: 'CLUT animation', description: 'Animated color palettes' },
  ] },
  { id: 'effects', name: 'Effects & scripts', description: 'Effect packages, their component resources, and game scripts.', entries: [
    { name: 'DEFF', description: 'Effect packages and model, sprite, and animation parts' },
    { name: 'Script bytecode', description: 'Scene, object, combat, and effect instructions' },
    { name: 'Effect data', description: 'Effect-specific texture, deformation, and animation records' },
  ] },
  { id: 'audio', name: 'Audio & video', description: 'Music sequences, sound banks, recordings, and cinematics.', entries: [
    { name: 'SSSQ', description: 'Music and playback sequences' },
    { name: 'SSHD', description: 'Sound definitions and instrument information' },
    { name: 'SPU sound banks', description: 'Samples used by music and sound effects' },
    { name: 'XA / Opus', description: 'Streamed recordings and SC-transcoded audio tracks' },
    { name: 'IKI', description: 'Full-motion video' },
  ] },
  { id: 'scenes', name: 'Scene data', description: 'Spatial information used to assemble and explore game environments.', entries: [
    { name: 'Environment', description: 'Camera and background / foreground placement' },
    { name: 'Collision', description: 'Walkable geometry and collision information' },
    { name: 'Transitions', description: 'Connections between exploration scenes' },
  ] },
];

export const GAME_ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'party', name: 'Party members', description: 'Character resources grouped by their role in the game.', entries: [
    { name: 'Battle & Dragoon forms', description: 'Models, textures, animations, and combat sounds' },
    { name: 'Exploration & world map', description: 'Character models, textures, and movement animations' },
    { name: 'Portraits', description: 'Character portrait artwork' },
  ] },
  { id: 'monsters', name: 'Monsters & NPCs', description: 'Enemies and the people encountered throughout the world.', entries: [
    { name: 'Monsters', description: 'Battle models, textures, animations, sounds, and scripts' },
    { name: 'NPCs', description: 'Scene models, textures, animations, and behavior scripts' },
  ] },
  { id: 'locations', name: 'Locations', description: 'The environments where exploration and battles take place.', entries: [
    { name: 'Submaps', description: 'Backgrounds, foregrounds, objects, cameras, collision, and scripts' },
    { name: 'Battle stages', description: 'Arena models, textures, animation, and backdrops' },
    { name: 'World map', description: 'Terrain, location imagery, and world objects' },
  ] },
  { id: 'abilities', name: 'Attacks & magic', description: 'Visual and audio resources for combat abilities and items.', entries: [
    { name: 'Attack items', description: 'Effects such as Burn Out, Spark Net, and Detonate Rock' },
    { name: 'Dragoon magic & transformations', description: 'Effect parts, animations, scripts, and sounds' },
    { name: 'Enemy attacks', description: 'Attack effects and their supporting resources' },
  ] },
  { id: 'interface', name: 'Interface & field effects', description: 'Artwork and effects used throughout the game.', entries: [
    { name: 'Interface artwork', description: 'Fonts, icons, and full-screen images' },
    { name: 'Field effects', description: 'Save points, arrows, shadows, dust, footprints, and smoke' },
  ] },
  { id: 'media', name: 'Music & cinematics', description: 'Soundtracks, recorded audio, and movie sequences.', entries: [
    { name: 'Music', description: 'Songs with their instrument definitions and sample banks' },
    { name: 'Recorded audio', description: 'Streamed audio tracks' },
    { name: 'Cinematics', description: 'Opening, story, and ending movies' },
  ] },
];
