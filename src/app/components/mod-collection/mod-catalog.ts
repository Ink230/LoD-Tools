export interface ModAuthor {
  readonly name: string;
  readonly url: string;
}

export type ScCompatibility = 'Latest SC' | 'RB3' | 'Special build' | 'Check compatibility';
export type ModTag = 'Full Campaign' | 'Randomizer' | 'QoL Minor' | 'Extension' | 'QoL Major';

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
    description: 'Build your own difficulty with spreadsheet-driven stats, rewards, shops, and addition settings, or start with a bundled preset.',
    releases: [{ version: '2.1.0', compatibility: 'RB3', url: 'https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier/releases/tag/v2.1.0' }],
    tags: ['Full Campaign'],
    infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier',
  },
  {
    id: 'irongoon',
    name: 'Irongoon',
    authors: [INK],
    description: 'Make every playthrough your own. Randomize characters, monsters, shops, and battle stages with configurable gameplay rules.',
    section: 'developer',
    releases: [
      { version: '0.4.16', compatibility: 'RB3', url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.16' },
      { version: '0.5.1', compatibility: 'Special build', url: 'https://github.com/Ink230/irongoon/releases/tag/irongoon-future' },
    ],
    releaseNote: 'v0.4.16 supports RB3. v0.5.1 requires the special SC build bundled on the Irongoon GitHub release.',
    tags: ['Full Campaign', 'Randomizer', 'QoL Minor', 'Extension'],
    infoUrl: 'https://github.com/Ink230/irongoon',
    configureUrl: '/mods/irongoon',
    configureLabel: 'Configure v0.5.1',
  },
  {
    id: 'legend-of-tides', name: 'The Legend of Tides', authors: [ICARUS], section: 'developer',
    description: 'Grab your rod and start a new fishing adventure in the world of The Legend of Dragoon.',
    releases: [{ version: '1.3.9', compatibility: 'RB3', url: 'https://github.com/avionanx/tlot/releases/tag/1.3.9' }],
    tags: ['Full Campaign'], infoUrl: 'https://github.com/avionanx/tlot',
  },
  {
    id: 'stardust-indicators', name: 'Stardust Indicators', authors: [ICARUS], section: 'developer',
    description: 'Give hidden Stardust a glowing sparkle so it is easier to spot on your travels.',
    releases: [{ version: '1.5', compatibility: 'RB3', url: 'https://github.com/avionanx/Stardust-Indicators/releases/tag/v1.5' }],
    tags: ['QoL Minor'], infoUrl: 'https://github.com/avionanx/Stardust-Indicators',
  },
  {
    id: 'upscale', name: 'Image Upscaling', authors: [ZYCHRONIX], section: 'developer',
    description: 'An anticipated visual upgrade for The Legend of Dragoon. The project is still in development and has not been released.',
    inDevelopment: true, releases: [], tags: [],
    infoUrl: 'https://legendofdragoon.org/projects/image-upscaling/',
  },
  {
    id: 'additional-additions', name: 'Additional Additions', authors: [ICARUS, LORDMONOXIDE], section: 'developer',
    description: 'Play with custom additions, then create and share your own using the companion Additional Additions Editor.',
    releases: [{ version: '0.2.5', compatibility: 'RB3', url: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions/releases/tag/0.2.5' }],
    tags: ['Extension'], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions',
    links: [{ label: 'Editor', url: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions-Editor' }],
  },
  {
    id: 'archipelago', name: 'Archipelago', authors: [{ name: 'pkolb-dev', url: 'https://github.com/pkolb-dev' }], section: 'top-rated',
    description: 'Bring The Legend of Dragoon into an Archipelago multiworld randomizer. Follow the setup guide to connect through Archipelagoon.',
    releases: [{ version: '2.0.9', compatibility: 'RB3', url: 'https://github.com/pkolb-dev/Archipelagoon/releases/tag/v2.0.9' }],
    tags: ['Randomizer'], infoUrl: 'https://github.com/pkolb-dev/Archipelago',
    links: [{ label: 'Setup guide', url: 'https://github.com/pkolb-dev/Archipelago/blob/main/worlds/legend_of_dragoon/docs/en_setup.md' }],
  },
  {
    id: 'assets-manager', name: 'TLoD Assets Manager', authors: [DOOM], section: 'tools',
    description: 'Convert models, animations, and textures through a shared asset browser, with glTF 2.0 export for modern workflows.',
    releases: [{ version: '0.2 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Assets-Manager/releases/tag/beta-v0.2' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Assets-Manager',
  },
  {
    id: 'tmd-converter', name: 'TLoD TMD Converter', authors: [DOOM], section: 'tools',
    description: 'Convert battle and effect models and animations into formats you can use in a 3D editing workflow.',
    releases: [{ version: '0.6 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-TMD-Converter/releases/tag/v0.6-beta-gui' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-TMD-Converter',
  },
  {
    id: 'texture-converter', name: 'TLoD Texture Converter', authors: [DOOM], section: 'tools',
    description: 'Convert game textures into PNG images, including supported TIM, MCQ, and PXL texture formats.',
    releases: [{ version: '0.2 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Texture-Converter/releases/tag/tlod_text_conv-beta.0.2' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Texture-Converter',
  },
  {
    id: 'blender-to-saf', name: 'Blender2SAF', authors: [DOOM], section: 'tools',
    description: 'Export baked Blender object animations into the SAF animation format used by The Legend of Dragoon.',
    releases: [{ version: '0.1 beta', url: 'https://github.com/Legend-of-Dragoon-Modding/Blender-Anim-To-TLoD/releases/tag/First_Release_B0.1' }],
    tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/Blender-Anim-To-TLoD',
    links: [{ label: 'Tutorial', url: 'https://www.youtube.com/watch?v=acGUVCX40_w&t=1147s' }],
  },
  {
    id: 'vertexcolor-material', name: 'New VertexColor Material', authors: [DOOM], section: 'tools',
    description: 'Set up vertex-color materials in Blender for models using the TLoD converter naming convention.',
    releases: [], tags: [], infoUrl: 'https://github.com/Legend-of-Dragoon-Modding/new-vertexcolor-material',
  },
];
