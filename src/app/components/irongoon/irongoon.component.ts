import { Component } from '@angular/core';
import { IrongoonNavigationTabs } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/iroongoon.service';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
})
export class IrongoonComponent {
  tabs: IrongoonNavigationTabs[] = [
    { id: 1, title: 'test' },
    { id: 2, title: 'test' },
    { id: 3, title: 'test' },
  ];

  constructor(private irongoonService: IrongoonService) {}
}
