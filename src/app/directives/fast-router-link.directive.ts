import { Directive, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Preserve the shared public selector
  selector: '[fastRouterLink]',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: ['routerLink:fastRouterLink', 'target'],
    },
  ],
})
export class FastRouterLinkDirective {
  private router = inject(Router);
  private readonly link = inject(RouterLink);

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (this.link.target && this.link.target !== '_self')) return;
    const url = this.link.urlTree;
    if (!url) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void this.router.navigateByUrl(url);
  }
}
