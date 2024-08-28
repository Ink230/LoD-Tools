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
  damage: number;
  sp: number;
  levels: AdditionLevel[];
  hitData: AdditionHit[];
}

export interface AdditionLevel {
  level: number;
  multiplier: AdditionMultiplier;
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

export interface DragoonSpell {
  name: string;
  description: string;
  element: Element;
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
