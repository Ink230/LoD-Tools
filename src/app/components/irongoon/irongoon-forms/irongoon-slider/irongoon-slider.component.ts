import { NgClass } from '@angular/common';
import { Component, input, signal, inject } from '@angular/core';
import { IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonFormTooltipComponent } from '../irongoon-form-tooltip/irongoon-form-tooltip.component';

@Component({
  selector: 'app-irongoon-slider',
  imports: [NgClass, IrongoonFormTooltipComponent],
  templateUrl: './irongoon-slider.component.html',
  styleUrl: './irongoon-slider.component.css',
})
export class IrongoonSliderComponent {
  private irongoonService = inject(IrongoonService);

  option = input<IrongoonOption>();
  isActiveTooltip = signal(false);

  onSliderClicked() {
    if (this.option().disabled) return;

    this.option().value = this.option().value == 1 ? 2 : 1;

    this.irongoonService.sendOptionUpdate();
  }

  toggleTooltips() {
    return this.irongoonService.toggleTooltips();
  }
}
