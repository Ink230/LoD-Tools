import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AgLineSeriesOptions } from 'ag-charts-community';
import { Body } from 'src/app/models/game-data.model';
import { GameDataService } from 'src/app/services/game-data.service';
import { GraphDisplayComponent } from '../../graph-display/graph-display.component';

@Component({
    selector: 'app-character-comparison',
    imports: [ReactiveFormsModule, GraphDisplayComponent],
    templateUrl: './character-comparison.component.html',
    styleUrl: './character-comparison.component.css'
})
export class CharacterComparisonComponent implements OnInit {
  gameDataService = inject(GameDataService);
  formBuilder = inject(FormBuilder);
  characterSelections: FormGroup;

  characterAttributes: CharacterAttribute[] = ['attack', 'defense', 'magicAttack', 'magicDefense', 'hp'];
  attributeLabels: Record<CharacterAttribute, string> = {
    attack: 'Attack',
    defense: 'Defense',
    magicAttack: 'Magic Attack',
    magicDefense: 'Magic Defense',
    hp: 'HP',
  };

  rowData = new BehaviorSubject<ChartBody[]>([]);
  seriesData = new BehaviorSubject<AgLineSeriesOptions<ChartBody>[]>([]);

  ngOnInit(): void {
    const characterFormControls = this.getCharacterNames().reduce<Record<number, FormGroup>>((controls, character) => {
      controls[character.id] = this.formBuilder.group({
        mainControl: new FormControl(false),
        attack: new FormControl(false),
        defense: new FormControl(false),
        magicAttack: new FormControl(false),
        magicDefense: new FormControl(false),
        hp: new FormControl(false),
      });
      return controls;
    }, {});
    this.characterSelections = this.formBuilder.group(characterFormControls);

    this.characterSelections.valueChanges.pipe().subscribe((c) => {
      const enabledCharacters = Object.keys(c)
        .map((key) => parseInt(key, 10))
        .filter((index) => c[index]?.mainControl);

      const allBodyStats: ChartBody[] = [];
      const series: AgLineSeriesOptions<ChartBody>[] = [];

      enabledCharacters.forEach((index) => {
        const character = this.gameDataService.getCharacterById(index);
        const characterBodyStatsData = character.bodyStats as ChartBody[];
        const characterControls = c[index];

        this.characterAttributes.forEach((attribute) => {
          if (characterControls[attribute]) {
            series.push({
              type: 'line',
              xKey: 'level',
              yKey: `${character.firstName}-${attribute}`,
              yName: `Character ${index} ${attribute.charAt(0).toUpperCase() + attribute.slice(1)}`,
            });

            characterBodyStatsData.forEach((bodyStat) => {
              bodyStat[`${character.firstName}-${attribute}`] = bodyStat[attribute];
            });
          }
        });

        allBodyStats.push(...characterBodyStatsData);
      });

      this.rowData.next(allBodyStats);
      this.seriesData.next(series);
    });
  }

  getCharacterNames(): { firstName: string; id: number }[] {
    return this.gameDataService.characterData.map((character) => ({ firstName: character.firstName, id: character.id }));
  }

  toggleCharacterControl(characterId: number) {
    const characterGroup = this.characterSelections.get(characterId.toString()) as FormGroup;
    const isActive = !characterGroup.get('mainControl').value;
    characterGroup.get('mainControl').setValue(isActive);

    if (isActive) {
      characterGroup.patchValue({
        attack: true,
        defense: true,
        magicAttack: true,
        magicDefense: true,
        hp: false,
      });
    } else {
      characterGroup.patchValue({
        attack: false,
        defense: false,
        magicAttack: false,
        magicDefense: false,
        Hhp: false,
      });
    }
  }

  toggleSubControl(characterId: number, controlName: string) {
    const characterGroup = this.characterSelections.get(characterId.toString()) as FormGroup;
    const control = characterGroup.get(controlName);
    control.setValue(!control.value);
    if (control.value) {
      characterGroup.get('mainControl').setValue(true);
    }
  }
}

type CharacterAttribute = 'attack' | 'defense' | 'magicAttack' | 'magicDefense' | 'hp';
type ChartBody = Body & Record<string, number>;
