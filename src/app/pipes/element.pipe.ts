import { Pipe, PipeTransform } from '@angular/core';
import { Element } from '../models/game-data.model';

@Pipe({
  name: 'element',
  standalone: true,
})
export class ElementPipe implements PipeTransform {
  transform(value: Element): string {
    const elementName = Element[value];
    return elementName.charAt(0).toUpperCase() + elementName.slice(1).toLowerCase();
  }
}
