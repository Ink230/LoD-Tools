import { describe, expect, it } from 'vitest';
import { KEY_ACTIONS, keyboardChord, WorldMapKeybindings } from './world-map-keybindings';

describe('editor keybindings', () => {
  it('applies a remapped shortcut and rejects same-scope conflicts', () => {
    const bindings = new WorldMapKeybindings();
    bindings.values = Object.fromEntries(KEY_ACTIONS.map(action => [action.id, action.key]));
    expect(bindings.assign('fit', 'Ctrl+g')).toBeUndefined();
    expect(bindings.matches('fit', new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }))).toBe(true);
    expect(bindings.matches('fit', new KeyboardEvent('keydown', { key: 'f' }))).toBe(false);
    expect(bindings.assign('zoomOut', 'Ctrl+g')).toContain('Fit map');
    bindings.reset();
  });
  it('normalizes Command and ignores modifier-only presses', () => {
    expect(keyboardChord(new KeyboardEvent('keydown', { key: 'Z', metaKey: true, shiftKey: true }))).toBe('Ctrl+Shift+z');
    expect(keyboardChord(new KeyboardEvent('keydown', { key: 'Shift', shiftKey: true }))).toBe('');
  });
});
