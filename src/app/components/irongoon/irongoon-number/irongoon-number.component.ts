import { Component, input } from '@angular/core';
import { NumericInputDirective } from 'src/app/directives/numeric-input.directive';
import { IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-number',
  standalone: true,
  imports: [NumericInputDirective],
  templateUrl: './irongoon-number.component.html',
  styleUrl: './irongoon-number.component.css',
})
export class IrongoonNumberComponent {
  option = input<IrongoonOption>();

  onFocusHighlightText(inputElement: HTMLInputElement) {
    inputElement.select();
  }
}
