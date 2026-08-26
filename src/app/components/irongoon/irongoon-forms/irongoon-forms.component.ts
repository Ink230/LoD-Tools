import { Component, inject, input } from '@angular/core';
import { IrongoonInputs, IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonDropdownComponent } from './irongoon-dropdown/irongoon-dropdown.component';
import { IrongoonNumberComponent } from './irongoon-number/irongoon-number.component';
import { IrongoonSliderComponent } from './irongoon-slider/irongoon-slider.component';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-forms',
  imports: [IrongoonDropdownComponent, IrongoonNumberComponent, IrongoonSliderComponent],
  templateUrl: './irongoon-forms.component.html',
  styleUrl: './irongoon-forms.component.css',
})
export class IrongoonFormsComponent {
  private readonly irongoonService = inject(IrongoonService);

  option = input<IrongoonOption>();
  irongoonInput = IrongoonInputs;

  isVisible() {
    return this.irongoonService.isOptionVisible(this.option());
  }
}
