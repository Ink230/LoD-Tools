import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WorldMapFieldsComponent } from './world-map-fields.component';
import type { WorldMapEditorComponent } from './world-map-editor.component';

@Component({
  selector: 'app-world-map-inspector',
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [WorldMapFieldsComponent],
  templateUrl: './world-map-inspector.component.html',
  styleUrl: './world-map-inspector.component.css',
})
export class WorldMapInspectorComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
}
