import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { childTemplate, OPTIONAL_ATTRIBUTES, referenceSection } from './world-map-document';

@Component({
  selector: 'app-world-map-fields',
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  template: `
    <div class="fields">
      @for (attribute of attributes; track attribute.name) {
        <label
          ><span>{{ attribute.name }}</span>
          @if (choices(attribute.name).length) {
            <input [attr.list]="listId(attribute.name)" [ngModel]="attribute.value" [readOnly]="locked(attribute.name)" (change)="set(attribute.name, $event)" />
            <datalist [id]="listId(attribute.name)">
              @for (choice of choices(attribute.name); track choice) {
                <option [value]="choice"></option>
              }
            </datalist>
          } @else {
            <input [ngModel]="attribute.value" [readOnly]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="attribute.name" />
          }
          @if (optionalAttributes.includes(attribute.name)) {
            <button class="remove" type="button" (click)="removeAttribute(attribute.name)" [attr.aria-label]="'Remove ' + attribute.name">×</button>
          }
        </label>
      }
      @for (attribute of missingAttributes; track attribute) {
        <button type="button" (click)="addAttribute(attribute)">+ {{ attribute }}</button>
      }
      @for (child of children; track child) {
        <details open>
          <summary>
            {{ child.tagName }}{{ child.getAttribute('id') ? ' · ' + child.getAttribute('id') : '' }}
            @if (canRemove(child)) {
              <button type="button" class="remove" (click)="removeChild(child, $event)" [attr.aria-label]="'Remove ' + child.tagName">×</button>
            }
          </summary>
          <app-world-map-fields [element]="child" [registry]="registry" (mutate)="mutate.emit($event)" />
        </details>
      }
      @if (isList) {
        <button type="button" (click)="addChild()">+ {{ element.tagName === 'capabilities' ? 'Capability' : 'Entry' }}</button>
      }
      @for (child of optionalChildren; track child) {
        <button type="button" (click)="addChild(child)">+ {{ child }}</button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font: inherit;
        color: inherit;
      }
      .fields {
        display: grid;
        gap: 8px;
      }
      label {
        display: grid;
        grid-template-columns: minmax(84px, 1fr) minmax(0, 1.4fr) auto;
        gap: 6px;
        align-items: center;
        font-size: 12px;
      }
      span {
        overflow-wrap: anywhere;
        color: #aab9ad;
      }
      input {
        all: revert;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        border: 1px solid #34473b;
        border-radius: 4px;
        background: #111c16;
        color: #e3eee5;
        padding: 7px;
        font:
          12px ui-monospace,
          monospace;
        caret-color: #b7e190;
      }
      button {
        all: revert;
        box-sizing: border-box;
        cursor: pointer;
        border: 1px solid #354a3c;
        border-radius: 4px;
        padding: 5px 8px;
        background: #213728;
        color: #bdd5c4;
        font: 12px system-ui;
      }
      button:hover {
        background: #304f38;
      }
      details {
        border-left: 2px solid #344f3c;
        padding-left: 9px;
      }
      summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        font: 600 12px system-ui;
        color: #a9d890;
        padding: 7px 0;
      }
      .remove {
        padding: 2px 6px;
        color: #edb0a3;
      }
      input:focus-visible,
      button:focus-visible {
        outline: 2px solid #b7e190;
        outline-offset: 1px;
      }
    `,
  ],
})
export class WorldMapFieldsComponent {
  @Input({ required: true }) element!: Element;
  @Input() registry: Record<string, string[]> = {};
  @Output() mutate = new EventEmitter<() => void>();
  get attributes() {
    return Array.from(this.element.attributes);
  }
  get children() {
    return this.element.tagName === 'worldMapPreset' ? [] : Array.from(this.element.children);
  }
  get optionalAttributes() {
    return OPTIONAL_ATTRIBUTES[this.element.tagName] || [];
  }
  get missingAttributes() {
    return this.optionalAttributes.filter((a) => !this.element.hasAttribute(a));
  }
  get isList() {
    return (
      [
        'points',
        'sounds',
        'encounters',
        'enabledPortals',
        'routes',
        'markers',
        'warps',
        'mapPositions',
        'regions',
        'services',
        'waterClutYs',
        'playerAvatarVramSlots',
        'textureAdjustments',
        'textures',
        'animations',
        'capabilities',
      ].includes(this.element.tagName) ||
      (this.element.tagName === 'portals' && this.element.parentElement?.tagName === 'rules')
    );
  }
  get optionalChildren() {
    const options: Record<string, string[]> = { region: ['assets'], avatar: ['assets'], traversalProfile: ['visualOffset'], camera: ['overviewPosition', 'minimum', 'maximum'] };
    return (options[this.element.tagName] || []).filter((name) => !this.children.some((c) => c.tagName === name));
  }
  choices(attribute: string): string[] {
    const section = referenceSection(this.element, attribute);
    if (section) return this.registry[section] || [];
    if (attribute === 'id' && this.element.tagName === 'capability') return ['COOLON', 'QUEEN_FURY_BOARDING'];
    if (attribute === 'continent' || attribute === 'legacyTemplate')
      return ['SOUTH_SERDIO_0', 'NORTH_SERDIO_1', 'TIBEROA_2', 'ILLISA_BAY_3', 'MILLE_SESEAU_4', 'GLORIANO_5', 'DEATH_FRONTIER_6', 'ENDINESS_7', ...(attribute === 'continent' ? ['NONE_8'] : [])];
    if (attribute === 'kind') return ['nodes', 'geometry', 'routes', 'places', 'portals'];
    if (attribute === 'texture' || attribute === 'model' || (attribute === 'value' && ['textures', 'animations'].includes(this.element.parentElement?.tagName)))
      return this.registry['assetPaths'] || [];
    const enums: Record<string, string[]> = {
      direction: ['1', '-1'],
      policy: ['STORY', 'OPEN'],
      phase: ['ENTER', 'TICK', 'MOVE', 'CROSS', 'EXIT'],
      mode: ['NORMAL', 'NONE', 'PNG'],
      code: ['ALLOWED', 'STORY_LOCKED', 'RULE_LOCKED', 'NO_PATH', 'WRONG_CONTINENT'],
    };
    if (enums[attribute]) return enums[attribute];
    if (['true', 'false'].includes(this.element.getAttribute(attribute))) return ['true', 'false'];
    return [];
  }
  listId(attribute: string) {
    return 'ref-' + this.element.tagName + '-' + attribute;
  }
  set(attribute: string, event: Event) {
    if (this.locked(attribute)) return;
    const value = (event.target as HTMLInputElement).value;
    this.mutate.emit(() => this.element.setAttribute(attribute, value));
  }
  addAttribute(attribute: string) {
    this.mutate.emit(() => this.element.setAttribute(attribute, ''));
  }
  removeAttribute(attribute: string) {
    this.mutate.emit(() => this.element.removeAttribute(attribute));
  }
  canRemove(child: Element) {
    if (this.element.tagName === 'points' && (child === this.element.firstElementChild || child === this.element.lastElementChild)) return false;
    return ['item', 'capability', 'assets', 'visualOffset', 'overviewPosition', 'minimum', 'maximum'].includes(child.tagName) || this.element.tagName === 'portals';
  }
  locked(attribute: string): boolean {
    const index = Number(this.element.getAttribute('legacyIndex'));
    return this.element.tagName === 'portal' && this.element.hasAttribute('legacyIndex') && index >= 0 && index < 256 && ['id', 'legacyIndex'].includes(attribute);
  }
  removeChild(child: Element, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.mutate.emit(() => child.remove());
  }
  addChild(name?: string) {
    this.mutate.emit(() => {
      const child = new DOMParser().parseFromString(childTemplate(this.element, name), 'application/xml').documentElement;
      const imported = this.element.ownerDocument.importNode(child, true);
      this.element.insertBefore(imported, this.element.tagName === 'points' ? this.element.lastElementChild : null);
    });
  }
}
