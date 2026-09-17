import { Component, Input } from '@angular/core';
import { FastRouterLinkDirective } from 'src/app/directives/fast-router-link.directive';

@Component({
  selector: 'app-editor-navigation',
  imports: [FastRouterLinkDirective],
  host: { '[class.site-navigation]': 'siteNavigation' },
  template: `
    <nav aria-label="Dragoon Mods">
      <a fastRouterLink="/">Home</a>
      <a fastRouterLink="/mods/irongoon">Irongoon</a>
      <a fastRouterLink="/data/summary">Game Data</a>
      <a fastRouterLink="/world-map-editor">World Map Editor</a>
      <a fastRouterLink="/asset-viewer">Asset Viewer</a>
    </nav>
  `,
  styles: `
    :host { position: absolute; right: 0; bottom: calc(100% + 12px); }
    :host.site-navigation { position: static; display: block; }
    nav { display: flex; justify-content: flex-end; gap: 16px; white-space: nowrap; text-align: right; font: 12px system-ui; }
    a { color: #a6cc96; text-decoration: none; }
    a:hover, a:focus-visible { color: #d2efc6; text-decoration: underline; text-underline-offset: 3px; }
  `,
})
export class EditorNavigationComponent {
  @Input() siteNavigation = false;
}
