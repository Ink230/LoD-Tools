import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-slider',
  standalone: true,
  imports: [NgClass],
  templateUrl: './irongoon-slider.component.html',
  styleUrl: './irongoon-slider.component.css',
})
export class IrongoonSliderComponent {
  option = input<IrongoonOption>();

  onSliderClicked(event: MouseEvent) {
    const clickedValue = parseInt((event.target as HTMLInputElement).value);

    if (this.option().disabled) return;

    if (this.option().value == clickedValue) {
      this.option().value = this.option().value == 1 ? 2 : 1;
      return;
    }

    this.option().value = clickedValue;
  }
}
