import { Component, input, inject } from '@angular/core';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonFormsComponent } from '../irongoon-forms/irongoon-forms.component';

@Component({
  selector: 'app-irongoon-category',
  templateUrl: './irongoon-category.component.html',
  styleUrl: './irongoon-category.component.css',
  imports: [IrongoonFormsComponent],
})
export class IrongoonCategoryComponent {
  private irongoonService = inject(IrongoonService);

  selectedTab = input<number>(0);

  getCategory() {
    return this.irongoonService.optionCategories[this.selectedTab()]?.columns;
  }
}
