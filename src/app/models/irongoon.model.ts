import { Type } from '@angular/core';

export interface IrongoonSettingCategories {
  id: number;
  title: string;
  // fun issue with typescript component typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export enum IrongoonInputs {
  Checkbox,
  Slider,
  Number,
  Dropdown,
}

export interface IrongoonNavigationTab {
  id: number;
  title: string;
}

export interface IrongoonCategories {
  id: number;
  name: string;
  columns: IrongoonColumns[];
}

export interface IrongoonColumns {
  id: number;
  name: string;
  settings: IrongoonSettings[];
}

export interface IrongoonSettings {
  id: number;
  name: string;
  options: IrongoonOption[];
}

export interface IrongoonOption {
  id: number;
  name: string;
  value: number;
  data?: DropdownOption;
  dataList?: DropdownOption[];
  inputType: IrongoonInputs;
  disabled?: boolean;
  descriptor?: string;
}

export interface DropdownOption {
  value: string;
  name: string;
}
