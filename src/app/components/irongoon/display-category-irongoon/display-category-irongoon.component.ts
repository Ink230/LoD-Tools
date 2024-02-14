import { Component, Input } from '@angular/core';
import { DropdownOption, IrongoonInputs, IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-display-category-irongoon',
  templateUrl: './display-category-irongoon.component.html',
  styleUrl: './display-category-irongoon.component.css',
})
export class DisplayCategoryIrongoonComponent {
  @Input() tabName = 'Presets';
  @Input() selectedTab = 0;

  irongoonInput = IrongoonInputs;

  constructor(private irongoonService: IrongoonService) {}

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab]?.columns;
  }

  onSliderClicked(event: MouseEvent, option: IrongoonOption) {
    const clickedValue = parseInt((event.target as HTMLInputElement).value);

    if (option.value == clickedValue) {
      option.value = option.value == 1 ? 2 : 1;
      return;
    }
      
    option.value = clickedValue;
  }

  onSelectionEvent(selected: DropdownOption, dropdownOptions: IrongoonOption) {
    if (!selected) return;

    dropdownOptions.data = selected;
  }
}
