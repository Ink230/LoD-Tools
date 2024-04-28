import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IrongoonInputs } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonDropdownComponent } from '../irongoon-dropdown/irongoon-dropdown.component';
import { IrongoonNumberComponent } from '../irongoon-number/irongoon-number.component';
import { IrongoonSliderComponent } from '../irongoon-slider/irongoon-slider.component';

@Component({
  selector: 'app-irongoon-category',
  templateUrl: './irongoon-category.component.html',
  styleUrl: './irongoon-category.component.css',
  standalone: true,
  imports: [NgClass, IrongoonDropdownComponent, IrongoonNumberComponent, IrongoonSliderComponent],
})
export class IrongoonCategoryComponent {
  selectedTab = input<number>(0);
  irongoonInput = IrongoonInputs;

  constructor(private irongoonService: IrongoonService) {}

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab()]?.columns;
  }
}
