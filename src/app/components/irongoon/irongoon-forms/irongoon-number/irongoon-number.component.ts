import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NumericInputDirective } from 'src/app/directives/numeric-input.directive';
import { IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-number',
  standalone: true,
  imports: [FormsModule, NumericInputDirective],
  templateUrl: './irongoon-number.component.html',
  styleUrl: './irongoon-number.component.css',
})
export class IrongoonNumberComponent {
  option = input<IrongoonOption>();

  constructor(private irongoonService: IrongoonService) {}

  onFocusHighlightText(inputElement: HTMLInputElement) {
    inputElement.select();
  }

  updateOption() {
    this.irongoonService.sendOptionUpdate();
  }
}
