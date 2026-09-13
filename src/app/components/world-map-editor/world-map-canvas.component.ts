import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorldMapTerrainComponent } from './world-map-terrain.component';
import type { WorldMapEditorComponent } from './world-map-editor.component';

/** Visual surface consumes the editor state; XML mutations stay in its document owner. */
@Component({
  selector: 'app-world-map-canvas',
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule, WorldMapTerrainComponent],
  templateUrl: './world-map-canvas.component.html',
  styleUrl: './world-map-canvas.component.css',
})
export class WorldMapCanvasComponent {
  @Input({ required: true }) editor!: WorldMapEditorComponent;
}
