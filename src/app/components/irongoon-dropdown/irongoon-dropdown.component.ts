import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DropdownOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-dropdown',
  templateUrl: './irongoon-dropdown.component.html',
  styleUrl: './irongoon-dropdown.component.css',
})
export class IrongoonDropdownComponent {
  @Input() dropdownOptions!: DropdownOption[];
  @Output() selectionEvent = new EventEmitter<DropdownOption>();

  selected!: DropdownOption;
  displayDropdown = false;
  dropdownIdentifier!: string;
  selectionIdentifier!: string;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.displayDropdown || target.id == this.selectionIdentifier) return;

    this.displayDropdown = false;
  }

  ngOnInit() {
    this.selected = this.dropdownOptions[0];
    this.dropdownIdentifier = `dropdown-identifier-${this.generateUUID()}`;
    this.selectionIdentifier = `selection-identifier-${this.generateUUID()}`;
  }

  toggleDropdown() {
    this.displayDropdown = !this.displayDropdown;
  }

  closeDropdown() {
    this.displayDropdown = false;
  }

  updateSelectedOption(item: any) {
    this.selected = item;
    this.selectionEvent.emit(this.selected);
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
