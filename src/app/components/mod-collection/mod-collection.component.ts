import { Component } from '@angular/core';
import { FastRouterLinkDirective } from '../../directives/fast-router-link.directive';

@Component({
  selector: 'app-mod-collection',
  imports: [FastRouterLinkDirective],
  templateUrl: './mod-collection.component.html',
  styleUrl: './mod-collection.component.css',
})
export class ModCollectionComponent {}
