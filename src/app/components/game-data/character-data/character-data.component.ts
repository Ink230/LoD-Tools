import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { BehaviorSubject, skip } from 'rxjs';
import { Character } from 'src/app/models/game-data.model';
import { ElementPipe } from 'src/app/pipes/element.pipe';
import { SpeciesPipe } from 'src/app/pipes/species.pipe';
import { GameDataService } from 'src/app/services/game-data.service';
import { GridDisplayComponent } from '../../grid-display/grid-display.component';
import { GameDataDropdownComponent } from '../game-data-forms/game-data-dropdown/game-data-dropdown.component';

@Component({
  selector: 'app-character-data',
  standalone: true,
  imports: [CommonModule, GameDataDropdownComponent, SpeciesPipe, ElementPipe, GridDisplayComponent],
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
  filteredCharacterBodyStats = new BehaviorSubject<any[]>([]);

  constructor() {
    this.characterSelected.pipe(skip(1)).subscribe((value: number) => {
      this.character = this.gameDataService.getCharacterById(value);
      this.filteredCharacterBodyStats.next(this.character.bodyStats);
    });

    this.includeTensOnly.subscribe(() => {
      if (!this.character) return;

      const allStats = this.character.bodyStats;
      const isTensOnly = this.includeTensOnly.getValue();

      const filteredData = isTensOnly
        ? allStats.filter((stat) => stat.level % 10 === 0) // Filter for levels divisible by 10
        : allStats; // No filtering

      this.filteredCharacterBodyStats.next(filteredData);
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
    this.includeTensOnly.next(event.target.checked);
  }
}
