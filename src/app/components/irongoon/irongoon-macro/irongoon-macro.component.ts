import { Component, inject } from '@angular/core';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-macro',
  imports: [],
  templateUrl: './irongoon-macro.component.html',
  styleUrl: './irongoon-macro.component.css',
})
export class IrongoonMacroComponent {
  private irongoonService = inject(IrongoonService);

  generateSeed() {
    this.irongoonService.generatePublicSeed();
  }

  randomizeRandomizer() {
    this.irongoonService.randomizeOptionCategories();
  }

  resetRandomizer() {
    this.irongoonService.resetOptionCategories();
  }
}
