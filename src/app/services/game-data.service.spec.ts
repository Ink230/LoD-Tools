import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { GameDataService } from './game-data.service';
import { Element } from '../models/game-data.model';

describe('character game data', () => {
  it('provides complete level tables and spells for every character', () => {
    const service = TestBed.inject(GameDataService);
    expect(service.characterData).toHaveLength(9);
    for (const character of service.characterData) {
      expect(character.bodyStats.map(row => row.level)).toEqual(Array.from({ length: 61 }, (_, index) => index));
      for (const dragoon of character.dragoons) {
        expect(dragoon.dragoonStats.map(row => row.level)).toEqual([1, 2, 3, 4, 5]);
        expect(dragoon.spells.length).toBeGreaterThan(0);
        expect(dragoon.spells.every(spell => spell.name && spell.mpCost > 0 && spell.element !== undefined)).toBe(true);
      }
    }
  });

  it('uses actual spell power and Kongol’s distinct unlock levels', () => {
    const service = TestBed.inject(GameDataService);
    const fire = service.getCharacterByName('dart').dragoons[0];
    expect(fire.spells[0]).toMatchObject({ name: 'Flameshot', damage: 50, mpCost: 10, unlockLevel: 1, element: Element.FIRE });
    expect(service.getCharacterByName('kongol').dragoons[0].spells.map(spell => spell.unlockLevel)).toEqual([1, 3, 5]);
  });

  it('includes both Divine spells without replacing Dart’s Fire spell set', () => {
    const dart = TestBed.inject(GameDataService).getCharacterByName('dart');
    expect(dart.dragoons).toHaveLength(2);
    expect(dart.dragoons[0].spells).toHaveLength(4);
    const divine = dart.dragoons.find(form => form.element === Element.DIVINE)!;
    expect(divine.spells.map(spell => spell.registryId)).toEqual(['lod:divine_dg_ball', 'lod:divine_dg_cannon']);
    expect(divine.spells.map(spell => spell.damage)).toEqual([100, 150]);
  });
});
