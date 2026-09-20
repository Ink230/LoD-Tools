import { Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild } from '@angular/core';

export interface SelectOption { readonly value: string; readonly label: string; }

@Component({
  selector: 'app-styled-select',
  templateUrl: './styled-select.component.html',
  styleUrl: './styled-select.component.css',
})
export class StyledSelectComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly active = signal(0);
  readonly selected = computed(() => this.options().find(option => option.value === this.value())?.label ?? '');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  toggle(): void {
    this.active.set(Math.max(0, this.options().findIndex(option => option.value === this.value())));
    this.open.update(open => !open);
  }

  choose(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'Tab') {
      this.open.set(false);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Enter', ' '].includes(key)) return;
    event.preventDefault();
    if (key === 'Escape') {
      this.open.set(false);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (!this.open()) this.toggle();
      else if (this.options()[this.active()]) this.choose(this.options()[this.active()].value);
      return;
    }
    if (!this.open()) this.toggle();
    const last = this.options().length - 1;
    if (key === 'Home') this.active.set(0);
    else if (key === 'End') this.active.set(last);
    else this.active.update(index => Math.max(0, Math.min(last, index + (key === 'ArrowDown' ? 1 : -1))));
  }

  @HostListener('document:click', ['$event'])
  closeOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
