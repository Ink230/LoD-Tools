import { Component, input } from '@angular/core';

@Component({
  selector: 'app-irongoon-form-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './irongoon-form-tooltip.component.html',
  styleUrl: './irongoon-form-tooltip.component.css',
})
export class IrongoonFormTooltipComponent {
  tooltip = input<string>();
  title = input<string>();
}
