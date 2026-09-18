import { Component } from '@angular/core';
import { FastRouterLinkDirective } from 'src/app/directives/fast-router-link.directive';

@Component({
  selector: 'app-editor-navigation',
  imports: [FastRouterLinkDirective],
  template: `
    <nav aria-label="Dragoon Mods">
      <span class="disabled-link" role="link" aria-disabled="true">Mods</span>
      <a fastRouterLink="/mods/irongoon">Irongoon</a>
      <a fastRouterLink="/data/summary">Game Data</a>
      <a fastRouterLink="/world-map-editor">World Map Editor</a>
      <a fastRouterLink="/asset-viewer">Asset Viewer</a>
    </nav>
  `,
  styles: `
    :host { display: block; }
    nav { display: flex; justify-content: flex-start; gap: 16px; white-space: nowrap; text-align: left; font: 12px system-ui; }
    a { color: #a6cc96; text-decoration: none; }
    .disabled-link { color: #777; font-weight: 700; cursor: default; }
    a:hover, a:focus-visible { color: #d2efc6; text-decoration: underline; text-underline-offset: 3px; }
  `,
})
export class EditorNavigationComponent {}
