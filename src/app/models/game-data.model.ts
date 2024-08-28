export interface Character {
  id: number;
  firstName: string;
  lastName: string;
  element: Element;
  species: Species;
  additions: Addition[];
  bodyStats: Body[];
  dragoons: Dragoon[];
}

export interface Addition {
  id: number;
  name: string;
  unlockLevel: number;
  unlockOrder: number;
  levels: AdditionLevel[];
}

export interface AdditionLevel {
  level: number;
  damage: number;
  sp: number;
  hitData?: AdditionHit[];
  multiplier: AdditionMultiplier;
}

export interface AdditionHit {
  flag: number;
  blueSquareFrames: number;
  postHitPauseFrames: number;
  actionInputFrames: number;
  damage: number;
  sp: number;
  lastHit: number;
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
}

export interface Dragoon {
  id: number;
  element: string;
  spells: DragoonSpell[];
  dragoonStats: DragoonStat[];
}

export interface DragoonSpell {
  name: string;
  description: string;
  element: string;
  damage: number;
  healPercent: number;
  mpCost: number;
  accuracy: number;
  target: Target;
  specialTarget: Target;
  specialEffect: number;
  statusChance: number;
  statusType: number;
  buffType: number;
}

export interface DragoonStat {
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
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
