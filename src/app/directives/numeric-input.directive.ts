import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[NumericInput]',
  standalone: true,
})
export class NumericInputDirective {
  constructor(private element: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const initialValue = this.element.nativeElement.value;
    this.element.nativeElement.value = initialValue.replace(/[^0-9]*/g, '');
    if (initialValue !== this.element.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
