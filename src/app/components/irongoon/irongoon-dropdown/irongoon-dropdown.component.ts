import { NgClass } from '@angular/common';
import { Component, HostListener, OnInit, input, signal } from '@angular/core';
import { IrongoonOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-dropdown',
  templateUrl: './irongoon-dropdown.component.html',
  styleUrl: './irongoon-dropdown.component.css',
  standalone: true,
  imports: [NgClass],
})
export class IrongoonDropdownComponent implements OnInit {
  option = input<IrongoonOption>();
  displayDropdown = signal(false);
  dropdownIdentifier = signal<string>(null);
  selectionIdentifier = signal<string>(null);

  constructor(private irongoonService: IrongoonService) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.displayDropdown() || target.id == this.selectionIdentifier()) return;

    this.displayDropdown.set(false);
  }

  ngOnInit() {
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

    this.option().data = item;
    this.irongoonService.sendOptionUpdate();
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
