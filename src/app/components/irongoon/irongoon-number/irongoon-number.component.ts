import { Component, input } from '@angular/core';
import { IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-number',
  standalone: true,
  imports: [],
  templateUrl: './irongoon-number.component.html',
  styleUrl: './irongoon-number.component.css',
})
export class IrongoonNumberComponent {
  option = input<IrongoonOption>();
}
