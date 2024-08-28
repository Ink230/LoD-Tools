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
}

export interface AdditionHit {}

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
  id: number;
  element: string;
  damage: number;
  target: Target;
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
