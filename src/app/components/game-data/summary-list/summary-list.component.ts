import { Component, inject } from '@angular/core';
import { FastRouterLinkDirective } from 'src/app/directives/fast-router-link.directive';
import { GameDataService } from 'src/app/services/game-data.service';

@Component({
  selector: 'app-summary-list',
  standalone: true,
  imports: [FastRouterLinkDirective],
  templateUrl: './summary-list.component.html',
  styleUrl: './summary-list.component.css',
})
export class SummaryListComponent {
  gameDataService = inject(GameDataService);

  characters = this.gameDataService.characterData;
}
