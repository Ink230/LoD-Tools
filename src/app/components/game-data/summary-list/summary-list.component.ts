import { Component } from '@angular/core';
import { FastRouterLinkDirective } from 'src/app/directives/fast-router-link.directive';

@Component({
  selector: 'app-summary-list',
  standalone: true,
  imports: [FastRouterLinkDirective],
  templateUrl: './summary-list.component.html',
  styleUrl: './summary-list.component.css',
})
export class SummaryListComponent {}
