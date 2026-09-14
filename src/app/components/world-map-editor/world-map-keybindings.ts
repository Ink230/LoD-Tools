export const KEY_ACTIONS = [
  { id: 'undo', label: 'Undo', key: 'Ctrl+z', scope: 'Page' },
  { id: 'redo', label: 'Redo', key: 'Ctrl+y', scope: 'Page' },
  { id: 'redoAlternate', label: 'Redo alternate', key: 'Ctrl+Shift+z', scope: 'Page' },
  { id: 'exitViewport', label: 'Exit fill viewport', key: 'Escape', scope: 'Page' },
  { id: 'up', label: 'Move up / pan up', key: 'ArrowUp', scope: 'Stage' },
  { id: 'down', label: 'Move down / pan down', key: 'ArrowDown', scope: 'Stage' },
  { id: 'left', label: 'Move left / pan left', key: 'ArrowLeft', scope: 'Stage' },
  { id: 'right', label: 'Move right / pan right', key: 'ArrowRight', scope: 'Stage' },
  { id: 'fastUp', label: 'Move up ×10 / pan up ×10', key: 'Shift+ArrowUp', scope: 'Stage' },
  { id: 'fastDown', label: 'Move down ×10 / pan down ×10', key: 'Shift+ArrowDown', scope: 'Stage' },
  { id: 'fastLeft', label: 'Move left ×10 / pan left ×10', key: 'Shift+ArrowLeft', scope: 'Stage' },
  { id: 'fastRight', label: 'Move right ×10 / pan right ×10', key: 'Shift+ArrowRight', scope: 'Stage' },
  { id: 'delete', label: 'Delete selected point / entity', key: 'Delete', scope: 'Stage' },
  { id: 'deleteAlternate', label: 'Delete alternate', key: 'Backspace', scope: 'Stage' },
  { id: 'fit', label: 'Fit map', key: 'f', scope: 'Stage' },
  { id: 'zoomIn', label: 'Zoom in', key: '=', scope: 'Stage' },
  { id: 'zoomInAlternate', label: 'Zoom in alternate', key: 'Shift++', scope: 'Stage' },
  { id: 'zoomOut', label: 'Zoom out', key: '-', scope: 'Stage' },
  { id: 'cancel', label: 'Finish tool / clear selection', key: 'Escape', scope: 'Stage' },
] as const;
export type KeyAction = typeof KEY_ACTIONS[number]['id'];
export function keyboardChord(event: KeyboardEvent): string {
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) return '';
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return `${event.ctrlKey || event.metaKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${key}`;
}
export class WorldMapKeybindings {
  values: Record<string, string> = Object.fromEntries(KEY_ACTIONS.map(action => [action.id, action.key]));
  constructor() {
    try {
      const stored = JSON.parse(localStorage.getItem('lodtools.world-map.keybindings') || 'null');
      for (const action of KEY_ACTIONS) {
        if (typeof stored?.[action.id] === 'string') this.values[action.id] = stored[action.id];
      }
    } catch { /* Defaults remain usable. */ }
  }
  matches(action: KeyAction, event: KeyboardEvent) { return !!this.values[action] && this.values[action] === keyboardChord(event); }
  assign(action: KeyAction, value: string): string | undefined {
    const definition = KEY_ACTIONS.find(entry => entry.id === action);
    const duplicate = KEY_ACTIONS.find(entry => entry.id !== action && entry.scope === definition.scope && value && this.values[entry.id] === value);
    if (duplicate) return `Already assigned to ${duplicate.label}. Clear that binding first.`;
    this.values[action] = value;
    this.save();
    return undefined;
  }
  reset() { this.values = Object.fromEntries(KEY_ACTIONS.map(action => [action.id, action.key])); this.save(); }
  private save() {
    try { localStorage.setItem('lodtools.world-map.keybindings', JSON.stringify(this.values)); } catch { /* Bindings still work this session. */ }
  }
}
