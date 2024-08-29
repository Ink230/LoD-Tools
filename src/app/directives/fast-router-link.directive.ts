import { Directive, HostListener, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Directive({
  selector: '[fastRouterLink]',
  standalone: true,
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: ['routerLink:appFastRouterLink'],
    },
  ],
})
export class FastRouterLinkDirective {
  @Input() fastRouterLink = '';

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.router.navigate([this.fastRouterLink]);
  }

  constructor(private router: Router) {}
}
