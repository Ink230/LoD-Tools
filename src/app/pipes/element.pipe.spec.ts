import { describe, expect, it } from 'vitest';
import { Element } from '../models/game-data.model';
import { ElementPipe } from './element.pipe';

describe('ElementPipe', () => {
  it('formats an element name for display', () => {
    expect(new ElementPipe().transform(Element.FIRE)).toBe('Fire');
  });
});
