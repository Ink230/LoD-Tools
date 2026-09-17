import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditorNavigationComponent } from '../editor-navigation/editor-navigation.component';
import { ScAttributionComponent } from '../sc-attribution/sc-attribution.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [RouterOutlet, EditorNavigationComponent, ScAttributionComponent]
})
export class AppComponent {
  resumeEditor(component: unknown) {
    (component as { resumeSession?: () => void }).resumeSession?.();
  }
  title = 'LoD Tools';
}
