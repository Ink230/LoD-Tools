import { Pipe, PipeTransform } from '@angular/core';
import { Species } from '../models/game-data.model';

@Pipe({
  name: 'species',
})
export class SpeciesPipe implements PipeTransform {
  transform(value: Species): string {
    const speciesName = Species[value];
    return speciesName.charAt(0).toUpperCase() + speciesName.slice(1).toLowerCase();
  }
}
