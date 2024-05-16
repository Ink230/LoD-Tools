import { Component } from '@angular/core';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-macro',
  standalone: true,
  imports: [],
  templateUrl: './irongoon-macro.component.html',
  styleUrl: './irongoon-macro.component.css',
})
export class IrongoonMacroComponent {
  constructor(private irongoonService: IrongoonService) {}

  randomizeRandomizer() {
    this.irongoonService.randomizeOptionCategories();
  }

  resetRandomizer() {
    this.irongoonService.resetOptionCategories();
  }
}
