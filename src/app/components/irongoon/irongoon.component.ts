import { Component } from '@angular/core';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
})
export class IrongoonComponent {
  tabs: any[] = [
    { id: 1, title: 'test' },
    { id: 2, title: 'test' },
    { id: 3, title: 'test' },
  ];
}
