import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CharacterDataComponent } from './character-data.component';

describe('character chart filters', () => {
  it('preserves metric and level filters when navigating between characters', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ selectedCharacter: 'dart' })) } }] });
    const component = TestBed.createComponent(CharacterDataComponent).componentInstance;
    component.ngOnInit();
    component.includeAttack.next(false);
    component.includeHP.next(true);
    component.includeFivesOnly.next(true);
    component.characterSelected.next(1);
    expect(component.character.firstName).toBe('Lavitz');
    expect(component.filteredCharacterBodyStats.value.every(row => row.level % 5 === 0)).toBe(true);
    const keys = component.filteredCharacterBodyStatsChartOptionsSeries.value.map(series => series.yKey);
    expect(keys).toContain('hp');
    expect(keys).not.toContain('attack');
  });
});
