import { Component } from '@angular/core';

@Component({
  selector: 'app-irongoon-dropdown',
  templateUrl: './irongoon-dropdown.component.html',
  styleUrl: './irongoon-dropdown.component.css',
})
export class IrongoonDropdownComponent {
  list = [
    { id: 1, name: 'first' },
    { id: 2, name: 'second' },
    { id: 3, name: 'third' },
  ];

  selected = {id: 1, name: 'first' }
}
