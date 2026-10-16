import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { EditorNavigationComponent } from '../editor-navigation/editor-navigation.component';
import { ScAttributionComponent } from '../sc-attribution/sc-attribution.component';
import { BrowserAgentService } from '../../services/browser-agent.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [RouterOutlet, EditorNavigationComponent, ScAttributionComponent]
})
export class AppComponent {
  private readonly browserAgent = inject(BrowserAgentService);
  private readonly router = inject(Router);
  get contentHref(): string { return this.router.url.split('#')[0] + '#page-content'; }
  resumeEditor(component: unknown) {
    (component as { resumeSession?: () => void }).resumeSession?.();
  }
  title = 'LoD Tools';
}
