import { Injectable, Optional, SkipSelf } from '@angular/core';
import { GameDataComponent } from '../components/game-data/game-data.component';
import { Character, Element, Species } from '../models/game-data.model';

@Injectable({
  providedIn: 'root',
})
export class GameDataService {
  public characterData: Character[] = [
    {
      id: 0,
      firstName: 'Dart',
      lastName: 'Feld',
      element: Element.FIRE,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 1,
      firstName: 'Lavitz',
      lastName: 'Slambert',
      element: Element.WIND,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 2,
      firstName: 'Shana',
      lastName: null,
      element: Element.LIGHT,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 3,
      firstName: 'Rose',
      lastName: null,
      element: Element.DARK,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 4,
      firstName: 'Haschel',
      lastName: null,
      element: Element.THUNDER,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 5,
      firstName: 'Albert',
      lastName: null,
      element: Element.WIND,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 6,
      firstName: 'Meru',
      lastName: null,
      element: Element.WATER,
      species: Species.WINGLY,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 7,
      firstName: 'Kongol',
      lastName: null,
      element: Element.EARTH,
      species: Species.GIGANTO,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
    {
      id: 8,
      firstName: 'Miranda',
      lastName: null,
      element: Element.LIGHT,
      species: Species.HUMAN,
      additions: null,
      bodyStats: null,
      dragoons: null,
    },
  ];

  constructor(@Optional() @SkipSelf() parentModule?: GameDataComponent) {
    if (parentModule) {
      throw new Error('GameDataService is already loaded. Import it in the GameDataComponent only');
    }
  }
}
