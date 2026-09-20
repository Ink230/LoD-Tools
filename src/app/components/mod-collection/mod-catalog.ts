export interface ModAuthor {
  readonly name: string;
  readonly url: string;
}

export type ScCompatibility = 'Latest SC' | 'RB3' | 'Special build' | 'Check compatibility';
export type ModTag = 'Full Campaign' | 'Randomizer' | 'QoL Minor' | 'Extension' | 'QoL Major' | 'Graphics';

export interface ModRelease {
  readonly version?: string;
  readonly compatibility?: ScCompatibility;
  readonly url: string;
}

export interface ModListing {
  readonly id: string;
  readonly name: string;
  readonly authors: readonly ModAuthor[];
  readonly description: string;
  readonly section: 'developer' | 'top-rated' | 'tools' | 'other';
  readonly releases: readonly ModRelease[];
  readonly tags: readonly ModTag[];
  readonly releaseNote?: string;
  readonly inDevelopment?: boolean;
  readonly rating?: number;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly infoUrl: string;
  readonly configureUrl?: string;
  readonly configureLabel?: string;
  readonly links?: readonly { readonly label: string; readonly url: string }[];
}

const INK: ModAuthor = { name: 'Ink', url: 'https://github.com/Ink230' };
const ZYCHRONIX: ModAuthor = { name: 'Zychronix', url: 'https://github.com/Zychronix' };
const ICARUS: ModAuthor = { name: 'Icarus', url: 'https://github.com/avionanx' };
// Verified in Severed-Chains/.github/FUNDING.yml.
const LORDMONOXIDE: ModAuthor = { name: 'LordMonoxide', url: 'https://ko-fi.com/monoxide' };
const DOOM: ModAuthor = { name: 'DooMMetaL', url: 'https://github.com/dragoonsouls' };

// Featured order and RB3 compatibility are curated. Release dates and commits
// do not establish compatibility with a new SC build; review each release target.
export const MOD_CATALOG: readonly ModListing[] = [
  {
    id: 'dragoon-modifier', name: 'Dragoon Modifier', authors: [ZYCHRONIX], section: 'developer',
    description: 'Configures stats, rewards, shop prices, and additions. Includes difficulty presets.',
    releases: [{ version: '2.1.0', compatibility: 'RB3', url: 'https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier/releases/tag/v2.1.0' }],
    tags: ['Full Campaign'],
    infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier',
  },
  {
    id: 'irongoon',
    name: 'Irongoon',
    authors: [INK],
    description: 'Randomizes characters, monsters, shops, and battle stages. Includes configurable gameplay rules and quality-of-life options.',
    section: 'developer',
    releases: [
      { version: '0.4.16', compatibility: 'RB3', url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.16' },
      { version: '0.5.1', compatibility: 'Special build', url: 'https://github.com/Ink230/irongoon/releases/tag/irongoon-future' },
    ],
    releaseNote: 'v0.4.16 supports SC RB3. v0.5.1 requires the SC build included with its release download.',
    tags: ['Full Campaign', 'Randomizer', 'QoL Minor', 'Extension'],
    infoUrl: 'https://github.com/Ink230/irongoon',
    configureUrl: '/mods/irongoon',
    configureLabel: 'Configure v0.5.1',
  },
  {
    id: 'legend-of-tides', name: 'The Legend of Tides', authors: [ICARUS], section: 'developer',
    description: 'Adds a fishing campaign to The Legend of Dragoon.',
    releases: [{ version: '1.3.9', compatibility: 'RB3', url: 'https://github.com/avionanx/tlot/releases/tag/1.3.9' }],
    tags: ['Full Campaign'], infoUrl: 'https://github.com/avionanx/tlot',
  },
  {
    id: 'stardust-indicators', name: 'Stardust Indicators', authors: [ICARUS], section: 'developer',
    description: 'Adds a sparkle effect to Stardust locations.',
    releases: [{ version: '1.5', compatibility: 'RB3', url: 'https://github.com/avionanx/Stardust-Indicators/releases/tag/v1.5' }],
    tags: ['QoL Minor'], infoUrl: 'https://github.com/avionanx/Stardust-Indicators',
  },
  {
    id: 'additional-additions', name: 'Additional Additions', authors: [ICARUS, LORDMONOXIDE], section: 'developer',
    description: 'Adds support for custom additions. The companion Additional Additions Editor creates and edits them.',
    releases: [{ version: '0.2.5', compatibility: 'RB3', url: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions/releases/tag/0.2.5' }],
    tags: ['Extension'], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions',
    links: [{ label: 'Editor', url: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions-Editor' }],
  },
  {
    id: 'upscale', name: 'Upscale Mod', authors: [ZYCHRONIX], section: 'developer',
    description: 'An image-upscaling project for The Legend of Dragoon. In development, with no release available.',
    inDevelopment: true, releases: [], tags: ['Graphics'],
    infoUrl: 'https://legendofdragoon.org/projects/image-upscaling/',
  },
  {
    id: 'archipelago', name: 'Archipelago', authors: [{ name: 'pkolb-dev', url: 'https://github.com/pkolb-dev' }], section: 'top-rated',
    description: 'Connects The Legend of Dragoon to Archipelago multiworld games through the Archipelagoon mod. Includes a setup guide.',
    releases: [{ version: '2.0.9', compatibility: 'RB3', url: 'https://github.com/pkolb-dev/Archipelagoon/releases/tag/v2.0.9' }],
    tags: ['Randomizer'], infoUrl: 'https://github.com/pkolb-dev/Archipelago',
    links: [{ label: 'Setup guide', url: 'https://github.com/pkolb-dev/Archipelago/blob/main/worlds/legend_of_dragoon/docs/en_setup.md' }],
  },
  {
    id: 'assets-manager', name: 'TLoD Assets Manager', authors: [DOOM], section: 'tools',
    description: 'Browses and converts game models, animations, and textures, with glTF 2.0 export.',
    releases: [{ version: '0.2 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Assets-Manager/releases/tag/beta-v0.2' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Assets-Manager',
  },
  {
    id: 'tmd-converter', name: 'TLoD TMD Converter', authors: [DOOM], section: 'tools',
    description: 'Converts game models and animations to Collada DAE files.',
    releases: [{ version: '0.6 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-TMD-Converter/releases/tag/v0.6-beta-gui' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-TMD-Converter',
  },
  {
    id: 'texture-converter', name: 'TLoD Texture Converter', authors: [DOOM], section: 'tools',
    description: 'Converts TIM, MCQ, and PXL game textures to PNG images.',
    releases: [{ version: '0.2 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Texture-Converter/releases/tag/tlod_text_conv-beta.0.2' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Texture-Converter',
  },
  {
    id: 'blender-to-saf', name: 'Blender2SAF', authors: [DOOM], section: 'tools',
    description: 'Exports baked Blender object animations to the SAF format used by The Legend of Dragoon.',
    releases: [{ version: '0.1 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/Blender-Anim-To-TLoD/releases/tag/First_Release_B0.1' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/Blender-Anim-To-TLoD',
    links: [{ label: 'Tutorial', url: 'https://www.youtube.com/watch?v=acGUVCX40_w&t=1147s' }],
  },
  {
    id: 'vertexcolor-material', name: 'New VertexColor Material', authors: [DOOM], section: 'tools',
    description: 'Creates vertex-color materials in Blender. Requires model names that follow the TLoD converter naming convention.',
    releases: [], tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/new-vertexcolor-material',
  },
];
