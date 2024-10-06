import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Character } from 'src/app/models/game-data.model';
import { GameDataService } from 'src/app/services/game-data.service';
import { GameDataDropdownComponent } from '../game-data-forms/game-data-dropdown/game-data-dropdown.component';

@Component({
  selector: 'app-character-data',
  standalone: true,
  imports: [GameDataDropdownComponent],
  templateUrl: './character-data.component.html',
  styleUrl: './character-data.component.css',
})
export class CharacterDataComponent {
  gameDataService = inject(GameDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  characterSelected = new BehaviorSubject<number>(0);
  character: Character;
  // characterOptions = signal<IrongoonOption>(null);

  constructor() {
    this.characterSelected.subscribe((value: number) => {
      this.character = this.gameDataService.getCharacterById(value);

      if (value) {
        this.router.navigate(['/data/character', this.character.firstName.toLowerCase()]);
      }
    });

    // this.characterOptions.set(this.gameDataService.characterOptions);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const characterName = params.get('selectedCharacter');
      if (characterName) {
        this.characterSelected.next(this.gameDataService.getCharacterByName(characterName).id);
      }
    });
  }

  // onCharacterSelected(event: string): void {
  //   this.characterSelected.next(parseInt(event));
  // }
}
