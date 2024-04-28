import { NgClass } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { DropdownOption, IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-dropdown',
  templateUrl: './irongoon-dropdown.component.html',
  styleUrl: './irongoon-dropdown.component.css',
  standalone: true,
  imports: [NgClass],
})
export class IrongoonDropdownComponent implements OnInit {
  @Input() option: IrongoonOption;
  @Output() selectionEvent = new EventEmitter<DropdownOption>();

  selected: DropdownOption;
  displayDropdown = false;
  dropdownIdentifier: string;
  selectionIdentifier: string;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.displayDropdown || target.id == this.selectionIdentifier) return;

    this.displayDropdown = false;
  }

  ngOnInit() {
    this.selected = this.option.data;
    this.dropdownIdentifier = `dropdown-identifier-${this.generateUUID()}`;
    this.selectionIdentifier = `selection-identifier-${this.generateUUID()}`;
  }

  toggleDropdown() {
    this.displayDropdown = !this.displayDropdown;
  }

  closeDropdown() {
    this.displayDropdown = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSelectedOption(item: any) {
    if (this.option.disabled) return;

    this.selected = item;
    this.option.data = this.selected;
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
