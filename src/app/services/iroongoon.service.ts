import { Injectable } from '@angular/core';
import { IrongoonSettingCategories } from '../models/irongoon.model';

@Injectable({
  providedIn: 'root',
})
export class IrongoonService {
  settingCategories: IrongoonSettingCategories[] = [
    { id: 0, title: 'presets' },
    { id: 1, title: 'characters' },
    { id: 2, title: 'dragoons' },
    { id: 3, title: 'enemies' },
    { id: 4, title: 'additions' },
    { id: 5, title: 'items' },
    { id: 6, title: 'shops' },
    { id: 7, title: 'combat' },
    { id: 8, title: 'chests' },
    { id: 9, title: 'audio' },
    { id: 10, title: 'other' },
  ];
}
