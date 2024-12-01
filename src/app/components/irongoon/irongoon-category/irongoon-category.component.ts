import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonFormsComponent } from '../irongoon-forms/irongoon-forms.component';

@Component({
    selector: 'app-irongoon-category',
    templateUrl: './irongoon-category.component.html',
    styleUrl: './irongoon-category.component.css',
    imports: [NgClass, IrongoonFormsComponent]
})
export class IrongoonCategoryComponent {
  selectedTab = input<number>(0);

  constructor(private irongoonService: IrongoonService) {}

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab()]?.columns;
  }
}
