export interface Character {
  id: number;
  firstName: string;
  lastName: string;
  element: Element;
  species: Species;
  hometown: string;
  acquired: number;
  additions: Addition[];
  bodyStats: Body[];
  dragoons: Dragoon[];
  flavour: FlavourText;
}

export interface Addition {
  id: number;
  name: string;
  unlockLevel: number;
  unlockOrder: number;
  damage: number;
  sp: number;
  levels: AdditionLevel[];
  hitData: AdditionHit[];
}

export interface AdditionLevel {
  level: number;
  multiplier: AdditionMultiplier;
}

export interface FlattenedAddition {
  id: number;
  name: string;
  unlockLevel: number;
  unlockOrder: number;
  level: number;
  damage: number;
  sp: number;
}

export interface AdditionHit {
  flag: number;
  blueSquareFrames: number;
  postHitPauseFrames: number;
  actionInputFrames: number;
  damage: number;
  sp: number;
  lastHit: boolean;
  panningDistance: number;
  cameraDistanceOne: number;
  cameraDistanceTwo: number;
  moveToMonsterFrames: number;
  distance: number;
  pauseFrames: number;
}

export interface FlattenedAdditionHit {
  id: number;
  name: string;
  flag: number;
  blueSquareFrames: number;
  postHitPauseFrames: number;
  actionInputFrames: number;
  damage: number;
  sp: number;
  lastHit: boolean;
  panningDistance: number;
  cameraDistanceOne: number;
  cameraDistanceTwo: number;
  moveToMonsterFrames: number;
  distance: number;
  pauseFrames: number;
}

export interface AdditionMultiplier {
  sp: number;
  damage: number;
}

export interface Body {
  level: number;
  attack: number;
  defense: number;
  speed: number;
  magicAttack: number;
  magicDefense: number;
  attackHit: number;
  attackAvoid: number;
  magicHit: number;
  magicAvoid: number;
  hp: number;
}

export interface Dragoon {
  element: Element;
  spells: DragoonSpell[];
  dragoonStats: DragoonStat[];
}

export interface DragoonSpellRaw {
  name: string;
  description: string;
  // raw data values vanilla
  element: number;
  damage: number;
  multiplier: number;
  mpCost: number;
  accuracy: number;
  target: number;
  specialTarget: number;
  specialEffect: number;
  statusChance: number;
  statusType: number;
  buffType: number;
}

export interface DragoonSpell {
  name: string;
  description: string;
  element: Element;
  damage: number;
}

export interface DragoonStat {
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
}

export interface FlavourText {
  background: string;
  dragoonSpirit: string[];
  commonStrategies: StrategyList;
}

export interface StrategyList {
  pros: StrategyPoint[];
  cons: StrategyPoint[];
}

export interface StrategyPoint {
  desc: string;
}

export enum Target {
  ALLY,
  ENEMY,
  ALL,
  MINOR_ENEMIES,
  ALL_ENEMIES,
  ALL_ALLYS,
}

export enum Element {
  NO_ELEMENT,
  WATER,
  EARTH,
  DARK,
  DIVINE,
  THUNDER,
  LIGHT,
  WIND,
  FIRE,
}

export enum Species {
  HUMAN,
  GIGANTO,
  WINGLY,
}

export interface GameDataOption {
  id: number;
  name: string;
}
