import { Type } from '@angular/core';

export interface IrongoonSettingCategories {
  id: number;
  title: string;
  component: Type<any>;
}

export enum IroongoonPresets {
  Irongoon = 'Irongoon',
  Ultimate = 'Ultimate',
  Kaizo = 'Kaizo',
  Shana = '108th',
  StandardRandomizer = 'Standard Randomizer',
  RandomRandom = 'Random Random',
}
