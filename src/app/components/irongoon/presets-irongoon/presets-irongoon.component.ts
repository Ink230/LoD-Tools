import { Component, Input } from '@angular/core';
import { IrongoonInputs } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-presets-irongoon',
  templateUrl: './presets-irongoon.component.html',
  styleUrl: './presets-irongoon.component.css',
})
export class PresetsIrongoonComponent {
  @Input() tabName = 'Presets';
  @Input() selectedTab = 0;

  irongoonInput = IrongoonInputs;

  constructor(private irongoonService: IrongoonService) {}

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab]?.columns;
  }
}
