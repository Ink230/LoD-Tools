import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Body } from 'src/app/models/game-data.model';
import { GameDataService } from 'src/app/services/game-data.service';
import { GraphDisplayComponent } from '../../graph-display/graph-display.component';

@Component({
  selector: 'app-character-comparison',
  standalone: true,
  imports: [ReactiveFormsModule, GraphDisplayComponent],
  templateUrl: './character-comparison.component.html',
  styleUrl: './character-comparison.component.css',
})
export class CharacterComparisonComponent implements OnInit {
  gameDataService = inject(GameDataService);
  formBuilder = inject(FormBuilder);
  characterSelections: FormGroup;

  characterAttributes = ['attack', 'defense', 'magicattack', 'magicdefense', 'HP'];
  attributeLabels = {
    attack: 'Attack',
    defense: 'Defense',
    magicattack: 'Magic Attack',
    magicdefense: 'Magic Defense',
    HP: 'HP',
  };

  rowData = new BehaviorSubject<Body[]>([]);
  seriesData = new BehaviorSubject<any>([]);

  ngOnInit(): void {
    const characterFormControls = this.getCharacterNames().reduce((controls, character) => {
      controls[character.id] = this.formBuilder.group({
        mainControl: new FormControl(false),
        attack: new FormControl(false),
        defense: new FormControl(false),
        magicattack: new FormControl(false),
        magicdefense: new FormControl(false),
        HP: new FormControl(false),
      });
      return controls;
    }, {});
    this.characterSelections = this.formBuilder.group(characterFormControls);

    this.rowData.next([
      { level: 0, attack: 2, defense: 4, speed: 40, magicAttack: 4, magicDefense: 2, magicAvoid: 0, magicHit: 0, attackHit: 0, attackAvoid: 0, hp: 500 },
      { level: 1, attack: 5, defense: 4, speed: 40, magicAttack: 4, magicDefense: 2, magicAvoid: 0, magicHit: 0, attackHit: 0, attackAvoid: 0, hp: 500 },
    ]);
    this.seriesData.next([{ type: 'line', xKey: 'level', yKey: 'attack' }]);

    this.characterSelections.valueChanges.pipe().subscribe((c) => {
      console.log(c);
      // loop through controls
      // pull char data for any control on
      // build rowData
      // build series
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
        magicattack: true,
        magicdefense: true,
        HP: false,
      });
    } else {
      characterGroup.patchValue({
        attack: false,
        defense: false,
        magicattack: false,
        magicdefense: false,
        HP: false,
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
