import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModListing } from './mod-catalog';

@Component({
  selector: 'app-mod-card',
  host: { '[class.rich]': '!compact()' },
  imports: [RouterLink],
  templateUrl: './mod-card.component.html',
  styleUrls: ['./mod-card.component.css', './mod-card-grid.css', './mod-card-selection.css'],
})
export class ModCardComponent {
  readonly mod = input.required<ModListing>();
  readonly compact = input(false);
  readonly selected = input(false);
  readonly selectable = input(false);
  readonly selectionDisabled = input(false);
  readonly downloadPending = input(false);
  readonly selectionTitle = input('No combined download available');
  readonly selectionChange = output<boolean>();
  readonly visibleReleases = computed(() => this.mod().releases.slice(0, this.mod().section === 'developer' ? 2 : 1));
  readonly compatibility = computed(() => this.mod().section === 'tools' ? 'Asset tool' : this.mod().releases[0]?.compatibility ?? 'Check compatibility');
}
