import { NgClass } from '@angular/common';
import { Component, HostListener, OnInit, effect, input, signal } from '@angular/core';
import { DropdownOption, IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
  selector: 'app-irongoon-dropdown',
  templateUrl: './irongoon-dropdown.component.html',
  styleUrl: './irongoon-dropdown.component.css',
  standalone: true,
  imports: [NgClass],
})
export class IrongoonDropdownComponent implements OnInit {
  option = input<IrongoonOption>();

  selected = signal<DropdownOption>(null);
  displayDropdown = signal(false);
  dropdownIdentifier = signal<string>(null);
  selectionIdentifier = signal<string>(null);

  constructor() {
    effect(
      () => {
        this.selected.set(this.option().data);
      },
      { allowSignalWrites: true }
    );
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.displayDropdown() || target.id == this.selectionIdentifier()) return;

    this.displayDropdown.set(false);
  }

  ngOnInit() {
    this.selected.set(this.option().data);
    this.dropdownIdentifier.set(`dropdown-identifier-${this.generateUUID()}`);
    this.selectionIdentifier.set(`selection-identifier-${this.generateUUID()}`);
  }

  toggleDropdown() {
    this.displayDropdown.set(!this.displayDropdown());
  }

  closeDropdown() {
    this.displayDropdown.set(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSelectedOption(item: any) {
    if (this.option().disabled) return;

    this.selected.set(item);
    this.option().data = this.selected();
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
