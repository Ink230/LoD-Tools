import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { childTemplate, entries, OPTIONAL_ATTRIBUTES, referenceSection, renameRegistryEntry } from './world-map-document';
import { fieldPresentation, isCompatibilityAttribute, isCompatibilityChild } from './world-map-field-metadata';

@Component({
  selector: 'app-world-map-fields',
  // XML DOM nodes mutate in place; refresh this isolated editor subtree when its owner changes.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  template: `
    <div class="fields" [class.coordinates]="coordinateRow" [class.removable-coordinates]="coordinateRow && removableEntry">
      @for (attribute of normalAttributes; track attribute.name) {
        <div class="field">
          <span class="field-copy" [hidden]="compactReference">
            <strong [title]="presentation(attribute.name).description || ''">{{ presentation(attribute.name).label }}</strong>
          </span>
          @if (target(attribute.name); as destination) {
              <button class="go" type="button" [attr.aria-label]="'Go to ' + attribute.value" (click)="navigate.emit(destination)">go</button>
            }
            @if (closedChoices(attribute.name).length) {
            <select [value]="attribute.value" [disabled]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="presentation(attribute.name).label">
              @for (choice of closedChoices(attribute.name); track choice) {
                <option [value]="choice" [selected]="choice === attribute.value">{{ choiceLabel(attribute.name, choice) }}</option>
              }
            </select>
          } @else if (choices(attribute.name).length || reference(attribute.name)) {
            <span class="input-stack">
              <input [attr.list]="listId(attribute.name)" (focus)="activeSuggestions = attribute.name" (blur)="activeSuggestions = null" [ngModel]="attribute.value" [readOnly]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="presentation(attribute.name).label" />
              @if (activeSuggestions === attribute.name) {
              <datalist [id]="listId(attribute.name)">
                @for (choice of choices(attribute.name); track choice) {
                  <option [value]="choice" [label]="choiceLabel(attribute.name, choice)"></option>
                }
              </datalist>
              }
              @if (selectedLabel(attribute.name, attribute.value)) {
                <small class="selection-label">{{ selectedLabel(attribute.name, attribute.value) }}</small>
              }
            </span>
          } @else {
            <input [type]="presentation(attribute.name).numeric ? 'number' : 'text'" [attr.step]="presentation(attribute.name).integer ? '1' : presentation(attribute.name).numeric ? 'any' : null" [ngModel]="attribute.value" [readOnly]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="presentation(attribute.name).label" />
          }
          @if (removableEntry && attribute.name === normalAttributes[0]?.name) {
            <button class="remove" type="button" (click)="removeEntry.emit($event)" aria-label="Remove entry">×</button>
          } @else if (optionalAttributes.includes(attribute.name)) {
            <button class="remove" type="button" (click)="removeAttribute(attribute.name)" [attr.aria-label]="'Remove ' + presentation(attribute.name).label">×</button>
          }
        </div>
      }

      @for (attribute of missingAttributes; track attribute) {
        <button type="button" (click)="addAttribute(attribute)">+ {{ presentation(attribute).label }}</button>
      }

      @for (child of normalChildren; track child) {
        @if (child.tagName === 'item') {
            <div [class.point-row]="element.tagName === 'points'" (dragover)="pointDragOver($event)" (drop)="dropPoint(child, $event)">
              @if (element.tagName === 'points') {
                <div class="point-heading"><span draggable="true" role="button" tabindex="0" aria-label="Drag point to reorder" (dragstart)="dragPoint = child; $event.stopPropagation()" (dragend)="dragPoint = null">⠿</span><button type="button" class="point-link" title="Show point on map" (click)="navigate.emit({ element: element.parentElement!, section: 'geometry', point: child })">{{ child === element.firstElementChild ? 'START' : child === element.lastElementChild ? 'END' : 'POINT ' + (normalChildren.indexOf(child) + 1) }}</button> @if (canRemove(child)) { <button type="button" class="point-remove" aria-label="Remove point" (click)="removeChild(child, $event)">×</button> }</div>
              }
          <app-world-map-fields [element]="child" [registry]="registry" [registryLabels]="registryLabels" [removableEntry]="element.tagName !== 'points' && canRemove(child)"
            (mutate)="mutate.emit($event)" (navigate)="navigate.emit($event)" (removeEntry)="removeChild(child, $event)" />
            </div>
        } @else {
        <section class="field-section">
          <div class="section-heading">
            {{ childLabelName(child.tagName) }}
            @if (canRemove(child)) {
              <button type="button" class="remove" (click)="removeChild(child, $event)" [attr.aria-label]="'Remove ' + child.tagName">×</button>
            }
          </div>
          <app-world-map-fields [element]="child" [registry]="registry" [registryLabels]="registryLabels" (mutate)="mutate.emit($event)" (navigate)="navigate.emit($event)" />
        </section>
        }
      }

      @if (hasCompatibility) {
        <details class="compatibility">
          <summary><span>Native compatibility</span><small>Retail fallbacks</small></summary>
          <div class="compatibility-fields">
            @for (attribute of compatibilityAttributes; track attribute.name) {
              <div class="field">
                <span class="field-copy" [hidden]="compactReference">
                  <strong [title]="presentation(attribute.name).description || ''">{{ presentation(attribute.name).label }}</strong>
                </span>
                @if (target(attribute.name); as destination) {
              <button class="go" type="button" [attr.aria-label]="'Go to ' + attribute.value" (click)="navigate.emit(destination)">go</button>
            }
            @if (closedChoices(attribute.name).length) {
                  <select [value]="attribute.value" [disabled]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="presentation(attribute.name).label">
                    @for (choice of closedChoices(attribute.name); track choice) {
                      <option [value]="choice" [selected]="choice === attribute.value">{{ choiceLabel(attribute.name, choice) }}</option>
                    }
                  </select>
                } @else {
                  <input [type]="presentation(attribute.name).numeric ? 'number' : 'text'" [attr.step]="presentation(attribute.name).integer ? '1' : presentation(attribute.name).numeric ? 'any' : null" [ngModel]="attribute.value" [readOnly]="locked(attribute.name)" (change)="set(attribute.name, $event)" [attr.aria-label]="presentation(attribute.name).label" />
                }
              </div>
            }
            @for (child of compatibilityChildren; track child) {
              <section class="field-section">
                <div class="section-heading">{{ childLabelName(child.tagName) }}</div>
                <app-world-map-fields [element]="child" [registry]="registry" [registryLabels]="registryLabels" (mutate)="mutate.emit($event)" (navigate)="navigate.emit($event)" />
              </section>
            }
          </div>
        </details>
      }

      @if (isList) {
        <button type="button" (click)="addChild()">+ {{ listItemLabel }}</button>
      }
      @for (child of optionalChildren; track child) {
        <button type="button" (click)="addChild(child)">+ {{ childLabelName(child) }}</button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; font: inherit; color: inherit; }
      .fields, .compatibility-fields { display: grid; gap: 10px; }
      .field { display: grid; grid-template-columns: 24px minmax(0, 1fr) 22px; column-gap: 6px; row-gap: 4px; align-items: start; font-size: 12px; }
      .point-row { border-bottom: 1px solid var(--wmap-color-46); padding-bottom: 8px; }
      .point-heading { display: flex; gap: 8px; align-items: center; color: var(--wmap-color-23); font: 10px ui-monospace, monospace; margin-bottom: 6px; }
      .point-link { padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
      .point-remove { margin-left: auto; width: 18px; height: 18px; padding: 0; font-size: 11px; line-height: 16px; }
      .point-link:hover { text-decoration: underline; }
      .point-heading [draggable] { cursor: grab; padding: 2px 6px; font-size: 16px; }
      .coordinates { position: relative; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 0 14px; }
      .coordinates .field { display: flex; flex-direction: column; min-width: 0; gap: 4px; }
      .coordinates input { padding: 7px 4px; font-size: 11px; appearance: textfield; }
      .coordinates input::-webkit-inner-spin-button, .coordinates input::-webkit-outer-spin-button { appearance: none; margin: 0; }
      .removable-coordinates { padding: 0 26px 0 14px; }
      .coordinates .remove { position: absolute; right: 0; bottom: 5px; width: 18px; height: 18px; padding: 0; font-size: 11px; line-height: 16px; }
      .field-copy[hidden] { display: none; }
    .field-copy { grid-column: 2; grid-row: 1; }
    .field > input, .field > select, .field > .input-stack { grid-column: 2; grid-row: 2; }
    .field > .remove { grid-column: 3; grid-row: 2; }
    .field > .go { grid-column: 1; grid-row: 2; align-self: start; padding: 7px 0; border: 0; background: none; color: var(--wmap-color-47); text-decoration: underline; }
    .field-copy, .input-stack { display: grid; min-width: 0; gap: 3px; }
      .field-copy strong { overflow-wrap: anywhere; color: var(--wmap-color-48); font-weight: 500; }
      .field-copy small, .selection-label { color: var(--wmap-color-49); font: 10px/1.3 system-ui, sans-serif; }
      .selection-label { color: var(--wmap-color-50); overflow-wrap: anywhere; }
      input, select { all: revert; box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--wmap-color-51); border-radius: 4px; background: var(--wmap-color-52); color: var(--wmap-color-53); padding: 7px; font: 12px ui-monospace, monospace; caret-color: var(--wmap-color-12); }
      select { cursor: pointer; }
      button { all: revert; box-sizing: border-box; cursor: pointer; border: 1px solid var(--wmap-color-54); border-radius: 4px; padding: 5px 8px; background: var(--wmap-color-55); color: var(--wmap-color-56); font: 12px system-ui; }
      button:hover { background: var(--wmap-color-57); }
      .field-section { min-width: 0; margin: 0; padding: 8px 0; border-top: 1px solid var(--wmap-color-58); border-bottom: 1px solid var(--wmap-color-59); }
    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 600 12px system-ui; color: var(--wmap-color-47); padding: 0 0 10px; }
      summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; font: 600 12px system-ui; color: var(--wmap-color-47); padding: 7px 0; }
      .compatibility { margin-top: 3px; border-top: 1px solid var(--wmap-color-46); border-bottom: 1px solid var(--wmap-color-46); }
      .compatibility > summary { padding: 8px 0; color: var(--wmap-color-60); }
      .compatibility > summary small { font: 9px ui-monospace, monospace; color: var(--wmap-color-61); text-transform: uppercase; letter-spacing: 0.5px; }
      .compatibility-fields { padding: 5px 0 10px; }
      .remove { padding: 2px 6px; color: #edb0a3; }
      input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--wmap-color-12); outline-offset: 1px; }
    `,
  ],
})
export class WorldMapFieldsComponent {
  private static nextId = 0;
  private readonly instanceId = WorldMapFieldsComponent.nextId++;
  activeSuggestions: string | null = null;
  @Input({ required: true }) element!: Element;
  @Input() registry: Record<string, string[]> = {};
  @Input() registryLabels: Record<string, Record<string, string>> = {};
  @Output() mutate = new EventEmitter<() => void>();
  @Output() navigate = new EventEmitter<{ element: Element; section: string; point?: Element }>();
  @Input() removableEntry = false;
  @Output() removeEntry = new EventEmitter<Event>();
  dragPoint: Element | null = null;
  pointDragOver(event: DragEvent) {
    if (!this.dragPoint) return;
    event.preventDefault();
    event.stopPropagation();
  }
  dropPoint(target: Element, event: DragEvent) {
    const source = this.dragPoint;
    if (!source || source === target) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const after = event.clientY >= bounds.top + bounds.height / 2;
    this.dragPoint = null;
    this.mutate.emit(() => {
      this.element.insertBefore(source, after ? target.nextElementSibling : target);
      const geometry = this.element.parentElement;
      for (const route of entries(this.element.ownerDocument, 'routes').filter((entry) => entry.getAttribute('geometry') === geometry?.getAttribute('id'))) {
        for (const field of ['start', 'end']) {
          const first = (field === 'start') !== (route.getAttribute('direction') === '-1');
          const point = first ? this.element.firstElementChild : this.element.lastElementChild;
          const node = entries(this.element.ownerDocument, 'nodes').find((entry) => entry.getAttribute('id') === route.getAttribute(field));
          const position = node?.querySelector('position');
          if (position && point) {
            for (const axis of ['x', 'y', 'z']) position.setAttribute(axis, point.getAttribute(axis) || '0');
          }
        }
      }
    });
  }
  get coordinateRow() { return ['x', 'y', 'z'].every((axis) => this.element.hasAttribute(axis)); }
  get compactReference() { return this.element.tagName === 'item' && this.attributes.length === 1 && Boolean(this.reference('id')); }

  get attributes() {
    const first = ['id', 'name', 'label', 'start', 'end', 'geometry', 'fromId', 'toId'];
    const rank = (name: string) => first.includes(name) ? first.indexOf(name) : first.length;
    return Array.from(this.element.attributes).sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
  }
  target(attribute: string): { element: Element; section: string } | undefined {
    const section = this.reference(attribute);
    if (!section) return undefined;
    const value = this.element.getAttribute(attribute);
    const element = entries(this.element.ownerDocument, section).find((entry) => entry.getAttribute('id') === value);
    return element ? { element, section } : undefined;
  }
  get normalAttributes() { return this.attributes.filter((attribute) => !isCompatibilityAttribute(this.element, attribute.name)); }
  get compatibilityAttributes() { return this.attributes.filter((attribute) => isCompatibilityAttribute(this.element, attribute.name)); }
  get children() { return this.element.tagName === 'worldMapPreset' ? [] : Array.from(this.element.children); }
  get normalChildren() { return this.children.filter((child) => !isCompatibilityChild(this.element, child)); }
  get compatibilityChildren() { return this.children.filter((child) => isCompatibilityChild(this.element, child)); }
  get hasCompatibility() { return Boolean(this.compatibilityAttributes.length || this.compatibilityChildren.length); }
  get optionalAttributes() {
    if (this.element.tagName === 'item' && this.element.parentElement?.tagName !== 'warps') return [];
    return OPTIONAL_ATTRIBUTES[this.element.tagName] || [];
  }
  get missingAttributes() { return this.optionalAttributes.filter((attribute) => !this.element.hasAttribute(attribute)); }
  get isList() {
    return (
      ['points', 'sounds', 'soundIds', 'serviceIds', 'encounters', 'enabledPortals', 'routes', 'markers', 'warps', 'mapPositions', 'regions', 'services', 'waterClutYs', 'playerAvatarVramSlots', 'textureAdjustments', 'textures', 'animations', 'capabilities'].includes(this.element.tagName) ||
      (this.element.tagName === 'portals' && this.element.parentElement?.tagName === 'rules')
    );
  }
  get optionalChildren() {
    const options: Record<string, string[]> = {
      place: ['serviceIds', 'soundIds'],
      region: ['assets'],
      avatar: ['assets'],
      traversalProfile: ['visualOffset'],
      camera: ['overviewPosition', 'minimum', 'maximum'],
    };
    return (options[this.element.tagName] || []).filter((name) => !this.children.some((child) => child.tagName === name));
  }
  get listItemLabel() {
    if (this.element.tagName === 'points') return 'Point';
    if (this.element.tagName === 'capabilities') return 'Capability';
    if (this.element.tagName === 'serviceIds') return 'Service';
    if (this.element.tagName === 'soundIds') return 'Sound';
    return 'Entry';
  }

  presentation(attribute: string) { return fieldPresentation(this.element, attribute); }
  reference(attribute: string) { return referenceSection(this.element, attribute); }
  choices(attribute: string): string[] {
    const section = this.reference(attribute);
    if (section) return this.registry[section] || [];
    if (attribute === 'texture' || attribute === 'model' || attribute === 'asset' || (attribute === 'value' && ['textures', 'animations'].includes(this.element.parentElement?.tagName)))
      return this.registry['assetPaths'] || [];
    return [];
  }
  closedChoices(attribute: string): string[] {
    if (attribute === 'id' && this.element.tagName === 'capability') return ['COOLON', 'QUEEN_FURY_BOARDING'];
    if (attribute === 'continent' || attribute === 'legacyTemplate')
      return ['SOUTH_SERDIO_0', 'NORTH_SERDIO_1', 'TIBEROA_2', 'ILLISA_BAY_3', 'MILLE_SESEAU_4', 'GLORIANO_5', 'DEATH_FRONTIER_6', 'ENDINESS_7', ...(attribute === 'continent' ? ['NONE_8'] : [])];
    if (attribute === 'kind') return ['nodes', 'geometry', 'routes', 'places', 'portals'];
    const enums: Record<string, string[]> = {
      direction: ['1', '-1'], policy: ['STORY', 'OPEN'], phase: ['ENTER', 'TICK', 'MOVE', 'CROSS', 'EXIT'], mode: ['NORMAL', 'NONE', 'PNG'],
      code: ['ALLOWED', 'STORY_LOCKED', 'RULE_LOCKED', 'NO_PATH', 'WRONG_CONTINENT'], atmosphere: ['NONE', 'CLOUDS', 'SNOW'], smoke: ['NONE', 'MODE_1', 'MODE_2'],
    };
    if (enums[attribute]) return enums[attribute];
    if (['true', 'false'].includes(this.element.getAttribute(attribute))) return ['true', 'false'];
    return [];
  }
  choiceLabel(attribute: string, choice: string) {
    const section = this.reference(attribute);
    return (section && this.registryLabels[section]?.[choice]) || choice;
  }
  selectedLabel(attribute: string, value: string) {
    const section = this.reference(attribute);
    return section ? this.registryLabels[section]?.[value] || '' : '';
  }
  childLabelName(name: string) {
    if (name === 'serviceIds') return 'Services';
    if (name === 'soundIds') return 'Sounds';
    return name.replace('Ids', '').replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
  }
  listId(attribute: string) { return 'ref-' + this.instanceId + '-' + attribute; }
  set(attribute: string, event: Event) {
    if (this.locked(attribute)) return;
    const input = event.target as HTMLInputElement;
    const value = input.value;
    input.setCustomValidity('');
    this.mutate.emit(() => {
      try {
        if (attribute === 'id') renameRegistryEntry(this.element, value);
        else this.element.setAttribute(attribute, value);
      } catch (error) {
        input.setCustomValidity(error instanceof Error ? error.message : String(error));
        input.reportValidity();
        input.value = this.element.getAttribute(attribute) || '';
      }
    });
  }
  addAttribute(attribute: string) { this.mutate.emit(() => this.element.setAttribute(attribute, '')); }
  removeAttribute(attribute: string) { this.mutate.emit(() => this.element.removeAttribute(attribute)); }
  canRemove(child: Element) {
    if (this.element.tagName === 'points' && (child === this.element.firstElementChild || child === this.element.lastElementChild)) return false;
    return ['item', 'capability', 'assets', 'visualOffset', 'overviewPosition', 'minimum', 'maximum', 'serviceIds', 'soundIds'].includes(child.tagName) || this.element.tagName === 'portals';
  }
  locked(attribute: string) {
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
