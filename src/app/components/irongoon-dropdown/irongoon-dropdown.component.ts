import { Component, HostListener } from '@angular/core';

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

  selected = this.list[0];

  displayDropdown = false;

  id = this.generateUUID();
  dropdownIdentifier = `dropdown-identifier-${this.id}`

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if ((event.target as HTMLElement).id === this.dropdownIdentifier) {
      const nested = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      if (nested) {
        nested.click();
      }
    }
  }

  toggleDropdown() {
    this.displayDropdown = !this.displayDropdown;
  }

  closeDropdown() {
    this.displayDropdown = false;
  }

  updateSelectedOption(item: any) {
    this.selected = item;
  }

  generateUUID(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
  }
}
