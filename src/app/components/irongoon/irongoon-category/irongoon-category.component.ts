import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DropdownOption, IrongoonInputs, IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonDropdownComponent } from '../irongoon-dropdown/irongoon-dropdown.component';

@Component({
    selector: 'app-irongoon-category',
    templateUrl: './irongoon-category.component.html',
    styleUrl: './irongoon-category.component.css',
    standalone: true,
    imports: [NgClass, IrongoonDropdownComponent],
})
export class IrongoonCategoryComponent {
  @Input() tabName = 'Presets';
  @Input() selectedTab = 0;

  irongoonInput = IrongoonInputs;

  constructor(private irongoonService: IrongoonService) {}

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab]?.columns;
  }

  onSliderClicked(event: MouseEvent, option: IrongoonOption) {
    const clickedValue = parseInt((event.target as HTMLInputElement).value);

    if (option.disabled) return;

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
