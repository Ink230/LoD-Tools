import { Component, input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NumericInputDirective } from 'src/app/directives/numeric-input.directive';
import { IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonFormTooltipComponent } from '../irongoon-form-tooltip/irongoon-form-tooltip.component';

@Component({
  selector: 'app-irongoon-number',
  imports: [FormsModule, NumericInputDirective, IrongoonFormTooltipComponent],
  templateUrl: './irongoon-number.component.html',
  styleUrl: './irongoon-number.component.css',
})
export class IrongoonNumberComponent {
  private irongoonService = inject(IrongoonService);

  option = input<IrongoonOption>();
  isActiveTooltip = signal(false);

  onFocusHighlightText(inputElement: HTMLInputElement) {
    inputElement.select();
  }

  updateOption() {
    this.irongoonService.sendOptionUpdate();
  }

  toggleTooltips() {
    return this.irongoonService.toggleTooltips();
  }
}
