import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IrongoonInputs, IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonDropdownComponent } from './irongoon-dropdown/irongoon-dropdown.component';
import { IrongoonNumberComponent } from './irongoon-number/irongoon-number.component';
import { IrongoonSliderComponent } from './irongoon-slider/irongoon-slider.component';

@Component({
  selector: 'app-irongoon-forms',
  standalone: true,
  imports: [NgClass, IrongoonDropdownComponent, IrongoonNumberComponent, IrongoonSliderComponent],
  templateUrl: './irongoon-forms.component.html',
  styleUrl: './irongoon-forms.component.css',
})
export class IrongoonFormsComponent {
  option = input<IrongoonOption>();
  irongoonInput = IrongoonInputs;
}
