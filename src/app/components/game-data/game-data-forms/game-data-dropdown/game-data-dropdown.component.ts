import { NgClass } from '@angular/common';
import { Component, HostListener, input, output, signal } from '@angular/core';
import { IrongoonFormTooltipComponent } from 'src/app/components/irongoon/irongoon-forms/irongoon-form-tooltip/irongoon-form-tooltip.component';
import { IrongoonOption } from 'src/app/models/irongoon.model';

@Component({
    selector: 'app-game-data-dropdown',
    imports: [NgClass, IrongoonFormTooltipComponent],
    templateUrl: './game-data-dropdown.component.html',
    styleUrl: './game-data-dropdown.component.css'
})
export class GameDataDropdownComponent {
  option = input<IrongoonOption>();
  displayDropdown = signal(false);
  dropdownIdentifier = signal<string>(null);
  selectionIdentifier = signal<string>(null);
  isActiveTooltip = signal(false);
  selection = output<string>();

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
    this.selection.emit(item.value);
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
