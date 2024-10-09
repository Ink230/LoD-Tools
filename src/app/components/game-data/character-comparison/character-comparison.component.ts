import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GameDataService } from 'src/app/services/game-data.service';

@Component({
  selector: 'app-character-comparison',
  standalone: true,
  imports: [ReactiveFormsModule],
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

    this.characterSelections.valueChanges.pipe().subscribe((c) => console.log(c));
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
  }
}
