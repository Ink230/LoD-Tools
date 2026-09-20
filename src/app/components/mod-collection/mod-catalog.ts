export interface ModListing {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly description: string;
  readonly section: 'developer' | 'top-rated' | 'tools' | 'other';
  readonly version?: string;
  readonly scVersions: readonly string[];
  readonly rating?: number;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly githubUrl: string;
  readonly configureUrl?: string;
  readonly links?: readonly { readonly label: string; readonly url: string }[];
}

// Matches the target documented by the Irongoon configuration builder.
// Add only verified compatibility, artwork, and ratings to this catalog.
export const MOD_CATALOG: readonly ModListing[] = [
  {
    id: 'irongoon',
    name: 'Irongoon',
    author: 'Ink',
    description: 'Make every playthrough your own. Randomize characters, monsters, shops, and battle stages with configurable gameplay rules.',
    section: 'developer',
    version: '0.5.1',
    scVersions: ['main.spike-testing'],
    githubUrl: 'https://github.com/Ink230/irongoon',
    configureUrl: '/mods/irongoon',
  },
  {
    id: 'dragoon-modifier', name: 'Dragoon Modifier', author: 'Zychronix', section: 'developer',
    description: 'Build your own difficulty with spreadsheet-driven stats, rewards, shops, and addition settings, or start with a bundled preset.',
    version: '2.1.0', scVersions: ['RB3 devbuild'],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier',
  },
  {
    id: 'additional-additions', name: 'Additional Additions', author: 'SC developers', section: 'developer',
    description: 'Play with custom additions, then create and share your own using the companion Additional Additions Editor.',
    version: '0.2.5', scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions',
    links: [{ label: 'Editor', url: 'https://github.com/Legend-of-Dragoon-Modding/Additional-Additions-Editor' }],
  },
  {
    id: 'legend-of-tides', name: 'The Legend of Tides', author: 'avionanx', section: 'developer',
    description: 'Grab your rod and start a new fishing adventure in the world of The Legend of Dragoon.',
    version: '1.3.9', scVersions: ['Devbuild'],
    githubUrl: 'https://github.com/avionanx/tlot',
  },
  {
    id: 'stardust-indicators', name: 'Stardust Indicators', author: 'avionanx', section: 'developer',
    description: 'Give hidden Stardust a glowing sparkle so it is easier to spot on your travels.',
    version: '1.5', scVersions: [],
    githubUrl: 'https://github.com/avionanx/Stardust-Indicators',
  },
  {
    id: 'archipelago', name: 'Archipelago', author: 'pkolb-dev', section: 'top-rated',
    description: 'Bring The Legend of Dragoon into an Archipelago multiworld randomizer. Follow the setup guide to connect through Archipelagoon.',
    scVersions: ['3.0.0 devbuild'],
    githubUrl: 'https://github.com/pkolb-dev/Archipelago',
    links: [{ label: 'Setup guide', url: 'https://github.com/pkolb-dev/Archipelago/blob/main/worlds/legend_of_dragoon/docs/en_setup.md' }],
  },
  {
    id: 'assets-manager', name: 'TLoD Assets Manager', author: 'DooMMetaL', section: 'tools',
    description: 'Convert models, animations, and textures through a shared asset browser, with glTF 2.0 export for modern workflows.',
    version: '0.2 beta', scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Assets-Manager',
  },
  {
    id: 'tmd-converter', name: 'TLoD TMD Converter', author: 'DooMMetaL', section: 'tools',
    description: 'Convert battle and effect models and animations into formats you can use in a 3D editing workflow.',
    version: '0.6 beta', scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-TMD-Converter',
  },
  {
    id: 'texture-converter', name: 'TLoD Texture Converter', author: 'DooMMetaL', section: 'tools',
    description: 'Convert game textures into PNG images, including supported TIM, MCQ, and PXL texture formats.',
    version: '0.2 beta', scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/TLoD-Texture-Converter',
  },
  {
    id: 'blender-to-saf', name: 'Blender2SAF', author: 'DooMMetaL', section: 'tools',
    description: 'Export baked Blender object animations into the SAF animation format used by The Legend of Dragoon.',
    version: '0.1 beta', scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/Blender-Anim-To-TLoD',
    links: [{ label: 'Tutorial', url: 'https://www.youtube.com/watch?v=acGUVCX40_w&t=1147s' }],
  },
  {
    id: 'vertexcolor-material', name: 'New VertexColor Material', author: 'DooMMetaL', section: 'tools',
    description: 'Set up vertex-color materials in Blender for models using the TLoD converter naming convention.',
    scVersions: [],
    githubUrl: 'https://github.com/Legend-of-Dragoon-Modding/new-vertexcolor-material',
  },
];
