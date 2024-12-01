import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FastRouterLinkDirective } from 'src/app/directives/fast-router-link.directive';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [RouterOutlet, FastRouterLinkDirective]
})
export class AppComponent {
  title = 'LoD Tools';
}
