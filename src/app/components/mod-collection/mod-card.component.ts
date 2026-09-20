import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModListing } from './mod-catalog';

@Component({
  selector: 'app-mod-card',
  imports: [RouterLink],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.css',
})
export class ModCardComponent {
  readonly mod = input.required<ModListing>();
  readonly compact = input(false);
  readonly compatibility = computed(() => this.mod().section === 'tools' ? 'Asset tool' : this.mod().releases[0]?.compatibility ?? 'Check compatibility');
}
