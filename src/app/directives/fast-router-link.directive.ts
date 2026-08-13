import { Directive, HostListener, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Directive({
  selector: '[fastRouterLink]',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: ['routerLink:appFastRouterLink'],
    },
  ],
})
export class FastRouterLinkDirective {
  private router = inject(Router);

  @Input() fastRouterLink = '';

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.router.navigate([this.fastRouterLink]);
  }
}
