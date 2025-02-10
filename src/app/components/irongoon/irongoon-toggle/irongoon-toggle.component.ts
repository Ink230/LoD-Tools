import { Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-toggle',
  imports: [],
  templateUrl: './irongoon-toggle.component.html',
  styleUrl: './irongoon-toggle.component.css',
})
export class IrongoonToggleComponent {
  irongoonService = inject(IrongoonService);
  toggleSubject = new BehaviorSubject<boolean>(this.irongoonService.toggleTooltips());

  constructor() {
    combineLatest([this.toggleSubject]).subscribe(([toggleSubject]) => {
      this.irongoonService.toggleTooltips.set(toggleSubject);
    });
  }

  onStreamChange(event: any): void {
    this.toggleSubject.next(event.target.checked);
  }
}
