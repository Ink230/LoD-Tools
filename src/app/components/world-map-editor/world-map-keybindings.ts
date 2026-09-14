export const KEY_ACTIONS = [
  { id: 'undo', label: 'Undo', key: 'Ctrl+z', scope: 'Page' },
  { id: 'redo', label: 'Redo', key: 'Ctrl+Shift+z', scope: 'Page' },
  { id: 'tools', label: 'Show/hide Tools', key: 't', scope: 'Page' },
  { id: 'pin', label: 'Pin/unpin toolbar', key: 'Shift+t', scope: 'Page' },
  { id: 'story', label: 'Include story refs', key: 'Shift+r', scope: 'Page' },
  { id: 'north', label: 'North', key: '1', scope: 'Page' },
  { id: 'east', label: 'East', key: '2', scope: 'Page' },
  { id: 'south', label: 'South', key: '3', scope: 'Page' },
  { id: 'west', label: 'West', key: '4', scope: 'Page' },
  { id: 'rotateLeft', label: 'Rotate counterclockwise', key: '[', scope: 'Page' },
  { id: 'rotateRight', label: 'Rotate clockwise', key: ']', scope: 'Page' },
  { id: 'focusStage', label: 'Focus stage', key: 'Shift+ ', scope: 'Page' },
  { id: 'coords', label: 'Coordinate grid/readout', key: 'x', scope: 'Page' },
  { id: 'labels', label: 'Show/hide labels', key: 'l', scope: 'Page' },
  { id: 'labelConfig', label: 'Configure labels', key: 'Shift+l', scope: 'Page' },
  { id: 'fit', label: 'Fit map', key: 'f', scope: 'Page' },
  { id: 'zoomIn', label: 'Zoom in', key: '=', scope: 'Page' },
  { id: 'zoomOut', label: 'Zoom out', key: '-', scope: 'Page' },
  { id: 'back', label: 'Previous entity', key: 'Alt+,', scope: 'Page' },
  { id: 'forward', label: 'Next entity', key: 'Alt+.', scope: 'Page' },
  { id: 'previousRegion', label: 'Previous region', key: 'PageUp', scope: 'Page' },
  { id: 'nextRegion', label: 'Next region', key: 'PageDown', scope: 'Page' },
  { id: 'select', label: 'Select mode', key: 'v', scope: 'Page' },
  { id: 'node', label: 'Place node', key: 'n', scope: 'Page' },
  { id: 'geometry', label: 'Draw geometry', key: 'g', scope: 'Page' },
  { id: 'junction', label: 'Junction', key: 'j', scope: 'Page' },
  { id: 'coolon', label: 'Coolon destination', key: 'c', scope: 'Page' },
  { id: 'portals', label: 'Portal view', key: 'p', scope: 'Page' },
  { id: 'places', label: 'Places view', key: 'Shift+p', scope: 'Page' },
  { id: 'registrySearch', label: 'Focus registry search', key: '/', scope: 'Page' },
  { id: 'command', label: 'Command search', key: 'Ctrl+k', scope: 'Page' },
  { id: 'inspector', label: 'Focus inspector', key: 'i', scope: 'Page' },
  { id: 'diagnostics', label: 'Diagnostics', key: 'd', scope: 'Page' },
  { id: 'config', label: 'Config', key: 'Shift+c', scope: 'Page' },
  { id: 'background', label: 'Background', key: 'b', scope: 'Page' },
  { id: 'map', label: 'Map view', key: 'Alt+1', scope: 'Page' },
  { id: 'xml', label: 'XML view', key: 'Alt+2', scope: 'Page' },
  { id: 'assets', label: 'Assets view', key: 'Alt+3', scope: 'Page' },
  { id: 'vanilla', label: 'Load vanilla', key: 'Ctrl+Alt+v', scope: 'Page' },
  { id: 'save', label: 'Save in browser', key: 'Ctrl+s', scope: 'Page' },
  { id: 'import', label: 'Import', key: 'Ctrl+o', scope: 'Page' },
  { id: 'export', label: 'Export .wmap', key: 'Ctrl+Alt+e', scope: 'Page' },
  { id: 'package', label: 'Export package', key: 'Ctrl+Alt+Shift+e', scope: 'Page' },
  { id: 'controls', label: 'Controls', key: 'Shift+?', scope: 'Page' },
  { id: 'viewport', label: 'Fill viewport', key: 'Shift+f', scope: 'Page' },
  { id: 'header', label: 'Collapse/expand header', key: 'h', scope: 'Page' },
  { id: 'theme', label: 'Cycle theme', key: 'Shift+h', scope: 'Page' },
  { id: 'up', label: 'Move/pan up', key: 'ArrowUp', scope: 'Stage' },
  { id: 'down', label: 'Move/pan down', key: 'ArrowDown', scope: 'Stage' },
  { id: 'left', label: 'Move/pan left', key: 'ArrowLeft', scope: 'Stage' },
  { id: 'right', label: 'Move/pan right', key: 'ArrowRight', scope: 'Stage' },
  { id: 'fastUp', label: 'Move/pan up ×10', key: 'Shift+ArrowUp', scope: 'Stage' },
  { id: 'fastDown', label: 'Move/pan down ×10', key: 'Shift+ArrowDown', scope: 'Stage' },
  { id: 'fastLeft', label: 'Move/pan left ×10', key: 'Shift+ArrowLeft', scope: 'Stage' },
  { id: 'fastRight', label: 'Move/pan right ×10', key: 'Shift+ArrowRight', scope: 'Stage' },
  { id: 'delete', label: 'Delete point/entity', key: 'Delete', scope: 'Stage' },
  { id: 'cancel', label: 'Close / finish / clear', key: 'Escape', scope: 'Page' },
  { id: 'inspectorNext', label: 'Next inspector control', key: 'Tab', scope: 'Inspector' },
  { id: 'inspectorPrevious', label: 'Previous inspector control', key: 'Shift+Tab', scope: 'Inspector' },
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
    if (duplicate) return `Already assigned to ${duplicate.label}. Unbind that action first.`;
    this.values[action] = value;
    this.save();
    return undefined;
  }
  reset() { this.values = Object.fromEntries(KEY_ACTIONS.map(action => [action.id, action.key])); this.save(); }
  private save() {
    try { localStorage.setItem('lodtools.world-map.keybindings', JSON.stringify(this.values)); } catch { /* Bindings still work this session. */ }
  }
}
