import { ColDef } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, skip } from 'rxjs';
import { Body, Character } from 'src/app/models/game-data.model';
import { ElementPipe } from 'src/app/pipes/element.pipe';
import { SpeciesPipe } from 'src/app/pipes/species.pipe';
import { GameDataService } from 'src/app/services/game-data.service';
import { GraphDisplayComponent } from '../../graph-display/graph-display.component';
import { GridDisplayComponent } from '../../grid-display/grid-display.component';
import { GameDataDropdownComponent } from '../game-data-forms/game-data-dropdown/game-data-dropdown.component';

@Component({
  selector: 'app-character-data',
  standalone: true,
  imports: [CommonModule, GameDataDropdownComponent, SpeciesPipe, ElementPipe, GridDisplayComponent, GraphDisplayComponent],
  templateUrl: './character-data.component.html',
  styleUrl: './character-data.component.css',
})
export class CharacterDataComponent {
  gameDataService = inject(GameDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  characterSelected = new BehaviorSubject<number>(0);
  character: Character;
  characterColumnDefinitions: ColDef[] = [{ field: 'level' }, { field: 'speed' }, { field: 'attack' }, { field: 'defense' }, { field: 'magicAttack' }, { field: 'magicDefense' }, { field: 'hp' }];
  includeTensOnly = new BehaviorSubject<boolean>(false);
  includeFivesOnly = new BehaviorSubject<boolean>(false);
  filteredCharacterBodyStats = new BehaviorSubject<Body[]>([]);
  filteredCharacterBodyStatsChartOptionsData = new BehaviorSubject<Body[]>([]);
  filteredCharacterBodyStatsChartOptionsSeries = new BehaviorSubject<any>([]);
  includeAttack = new BehaviorSubject<boolean>(true);
  includeDefense = new BehaviorSubject<boolean>(true);
  includeMagicAttack = new BehaviorSubject<boolean>(true);
  includeMagicDefense = new BehaviorSubject<boolean>(true);
  includeHP = new BehaviorSubject<boolean>(false);

  constructor() {
    this.characterSelected.pipe(skip(1)).subscribe((value: number) => {
      this.character = this.gameDataService.getCharacterById(value);
      this.filteredCharacterBodyStats.next(this.character.bodyStats);
      this.filteredCharacterBodyStatsChartOptionsData.next(this.character.bodyStats);
      this.filteredCharacterBodyStatsChartOptionsSeries.next([
        { type: 'line', xKey: 'level', yKey: 'attack' },
        { type: 'line', xKey: 'level', yKey: 'defense' },
        { type: 'line', xKey: 'level', yKey: 'magicAttack' },
        { type: 'line', xKey: 'level', yKey: 'magicDefense' },
      ]);
    });

    combineLatest([this.includeTensOnly, this.includeFivesOnly, this.includeAttack, this.includeDefense, this.includeMagicAttack, this.includeMagicDefense, this.includeHP]).subscribe(
      ([isTensOnly, isFivesOnly, isAttack, isDefense, isMagicAttack, isMagicDefense, isHP]) => {
        if (!this.character) return;

        const allStats = this.character.bodyStats;

        const filteredData = allStats.filter((stat) => {
          const isLevelTens = isTensOnly ? stat.level % 10 === 0 : true;
          const isLevelFives = isFivesOnly ? stat.level % 5 === 0 : true;
          return isLevelTens && isLevelFives;
        });

        this.filteredCharacterBodyStats.next(filteredData);
        this.filteredCharacterBodyStatsChartOptionsData.next(filteredData);

        const series: any[] = [];

        if (isAttack) {
          series.push({ type: 'line', xKey: 'level', yKey: 'attack' });
        }
        if (isDefense) {
          series.push({ type: 'line', xKey: 'level', yKey: 'defense' });
        }
        if (isMagicAttack) {
          series.push({ type: 'line', xKey: 'level', yKey: 'magicAttack' });
        }
        if (isMagicDefense) {
          series.push({ type: 'line', xKey: 'level', yKey: 'magicDefense' });
        }
        if (isHP) {
          series.push({ type: 'line', xKey: 'level', yKey: 'hp' });
        }

        this.filteredCharacterBodyStatsChartOptionsSeries.next(series);
      }
    );
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const characterName = params.get('selectedCharacter');
      if (characterName) {
        this.characterSelected.next(this.gameDataService.getCharacterByName(characterName).id);
      }
    });
  }

  onFilterCharacterLevelChange(event: any): void {
    const isChecked = event.target.checked;
    const labelText = event.target.nextElementSibling.textContent;

    const checkboxMapping: { [key: string]: BehaviorSubject<boolean> } = {
      'Include 10s only': this.includeTensOnly,
      'Include 5s Only': this.includeFivesOnly,
      Attack: this.includeAttack,
      Defense: this.includeDefense,
      'Magic Attack': this.includeMagicAttack,
      'Magic Defense': this.includeMagicDefense,
      HP: this.includeHP,
    };

    if (labelText.includes('10s')) {
      this.includeTensOnly.next(isChecked);
      if (isChecked) {
        this.includeFivesOnly.next(false);
      }
    } else if (labelText.includes('5s')) {
      this.includeFivesOnly.next(isChecked);
      if (isChecked) {
        this.includeTensOnly.next(false);
      }
    } else {
      const behaviorSubject = checkboxMapping[labelText];
      if (behaviorSubject) {
        behaviorSubject.next(isChecked);
      }
    }
  }
}
