import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, skip } from 'rxjs';
import { Character } from 'src/app/models/game-data.model';
import { ElementPipe } from 'src/app/pipes/element.pipe';
import { SpeciesPipe } from 'src/app/pipes/species.pipe';
import { GameDataService } from 'src/app/services/game-data.service';
import { GameDataDropdownComponent } from '../game-data-forms/game-data-dropdown/game-data-dropdown.component';

@Component({
  selector: 'app-character-data',
  standalone: true,
  imports: [GameDataDropdownComponent, SpeciesPipe, ElementPipe],
  templateUrl: './character-data.component.html',
  styleUrl: './character-data.component.css',
})
export class CharacterDataComponent {
  gameDataService = inject(GameDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  characterSelected = new BehaviorSubject<number>(0);
  character: Character;

  constructor() {
    this.characterSelected.pipe(skip(1)).subscribe((value: number) => {
      this.character = this.gameDataService.getCharacterById(value);
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
}
