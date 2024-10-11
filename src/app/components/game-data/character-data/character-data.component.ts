import { ColDef } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, skip } from 'rxjs';
import { Addition, Body, Character, FlattenedAddition, FlattenedAdditionHit } from 'src/app/models/game-data.model';
import { ElementPipe } from 'src/app/pipes/element.pipe';
import { SpeciesPipe } from 'src/app/pipes/species.pipe';
import { GameDataService } from 'src/app/services/game-data.service';
import { GraphDisplayComponent } from '../../graph-display/graph-display.component';
import { GridDisplayComponent } from '../../grid-display/grid-display.component';
import { GameDataDropdownComponent } from '../game-data-forms/game-data-dropdown/game-data-dropdown.component';

@Component({
  selector: 'app-character-data',
  standalone: true,
  imports: [CommonModule, GameDataDropdownComponent, SpeciesPipe, ElementPipe, GridDisplayComponent, GraphDisplayComponent, ReactiveFormsModule],
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
  filteredCharacterAdditionBasicStats = new BehaviorSubject<FlattenedAddition[]>([]);
  includeMaxAdditions = new FormControl(false);

  characterAdditionColumnDefinitions: ColDef[] = [
    { field: 'id' },
    { field: 'name' },
    { field: 'unlockLevel' },
    { field: 'unlockOrder' },
    { field: 'level', headerName: 'Addition Level' },
    { field: 'damage', headerName: 'Damage %' },
    { field: 'sp', headerName: 'SP' },
  ];
  characterAdditionHitColumnDefinitions: ColDef[] = [
    { field: 'id', headerName: 'Id', width: 10 },
    { field: 'name' },
    { field: 'flag', width: 100 },
    { field: 'blueSquareFrames', headerName: 'Blue Squares' },
    { field: 'postHitPauseFrames', headerName: 'Post Hit Pause' },
    { field: 'actionInputFrames', headerName: 'Action Frames' },
    { field: 'damage', width: 140 },
    { field: 'sp', width: 20 },
    { field: 'lastHit', width: 140 },
    { field: 'panningDistance', headerName: 'Panning Distance' },
    { field: 'cameraDistanceOne', headerName: 'Camera 1', width: 140 },
    { field: 'cameraDistanceTwo', headerName: 'Camera 2', width: 140 },
    { field: 'moveToMonsterFrames', headerName: 'Move to Enemy' },
    { field: 'distance', width: 140 },
    { field: 'pauseFrames', headerName: 'Initial Pause' },
  ];

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
      this.filteredCharacterAdditionBasicStats.next(this.flattenAdditionAndAdditionLevels(this.character.additions));
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

    this.includeMaxAdditions.valueChanges.subscribe((value) => {
      if (value) {
        this.filteredCharacterAdditionBasicStats.next(this.flattenMaxAdditions(this.character.additions));
        return;
      }

      this.filteredCharacterAdditionBasicStats.next(this.flattenAdditionAndAdditionLevels(this.character.additions));
    });
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

  flattenAdditionAndAdditionLevels(additions: Addition[]): FlattenedAddition[] {
    return additions.flatMap((addition) =>
      addition.levels.map((level, index) => ({
        id: index === 0 ? addition.id : null,
        name: index === 0 ? addition.name : null,
        unlockLevel: index === 0 ? addition.unlockLevel : null,
        unlockOrder: index === 0 ? addition.unlockOrder : null,
        level: level.level,
        damage: Math.floor(addition.damage * (1 + level.multiplier.damage / 100)),
        sp: addition.sp * (1 + level.multiplier.sp / 100),
      }))
    );
  }

  flattenMaxAdditions(additions: Addition[]): FlattenedAddition[] {
    return additions.flatMap((addition) => {
      const addy = addition.levels[4];

      if (!addy?.multiplier) return null;
      return {
        id: addition.id,
        name: addition.name,
        unlockLevel: addition.unlockLevel,
        unlockOrder: addition.unlockOrder,
        level: 5,
        damage: Math.floor(addition.damage * (1 + addy.multiplier.damage / 100)),
        sp: addition.sp * (1 + addy.multiplier.sp / 100),
      };
    });
  }

  flattenAdditionHits(additions: Addition[]): FlattenedAdditionHit[] {
    return additions.flatMap((addition) =>
      addition.hitData.map((row) => ({
        id: addition.id,
        name: addition.name,
        flag: row.flag,
        blueSquareFrames: row.blueSquareFrames,
        postHitPauseFrames: row.postHitPauseFrames,
        actionInputFrames: row.actionInputFrames,
        damage: row.damage,
        sp: row.sp,
        lastHit: row.lastHit,
        panningDistance: row.panningDistance,
        cameraDistanceOne: row.cameraDistanceOne,
        cameraDistanceTwo: row.cameraDistanceTwo,
        moveToMonsterFrames: row.moveToMonsterFrames,
        distance: row.distance,
        pauseFrames: row.pauseFrames,
      }))
    );
  }
}
