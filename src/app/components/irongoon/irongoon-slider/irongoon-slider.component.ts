import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-slider',
  standalone: true,
  imports: [NgClass],
  templateUrl: './irongoon-slider.component.html',
  styleUrl: './irongoon-slider.component.css',
})
export class IrongoonSliderComponent {
  option = input<IrongoonOption>();

  constructor(private irongoonService: IrongoonService) {}

  onSliderClicked() {
    if (this.option().disabled) return;

    this.option().value = this.option().value == 1 ? 2 : 1;

    this.irongoonService.sendOptionUpdate();
  }
}
