import { Component, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Character } from 'src/app/models/game-data.model';
import { IrongoonOption } from 'src/app/models/irongoon.model';
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

  characterSelected = new BehaviorSubject<number>(0);
  character: Character;
  characterOptions = signal<IrongoonOption>(null);

  constructor() {
    this.characterSelected.subscribe((value: number) => {
      this.character = this.gameDataService.getCharacterById(value);
    });

    this.characterOptions.set(this.gameDataService.characterOptions);
  }

  onCharacterSelected(event: string): void {
    this.characterSelected.next(parseInt(event));
  }
}
