import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { WorldMapEditorComponent } from './world-map-editor.component';

@Component({
  selector: 'app-world-map-document-panels',
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './world-map-document-panels.component.html',
  styleUrl: './world-map-document-panels.component.css',
})
export class WorldMapDocumentPanelsComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
}
