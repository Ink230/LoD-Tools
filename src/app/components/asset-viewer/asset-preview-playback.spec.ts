import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AssetPreviewComponent } from './asset-preview.component';

describe('animation playback speed', () => {
  it('ignores cursor movement after releasing an animation drag', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.animation = { format: 'LMB', fps: 15, frames: [[], [], []], warnings: [] };
    let captured = false;
    const input = {
      focus: (): void => undefined,
      setPointerCapture: () => { captured = true; },
      hasPointerCapture: () => captured,
      releasePointerCapture: () => { captured = false; },
      getBoundingClientRect: () => ({ left: 0, width: 122 }),
    };
    const pointer = (clientX: number, buttons = 1) => ({ button: 0, buttons, pointerId: 1, currentTarget: input, clientX, preventDefault: (): void => undefined }) as unknown as PointerEvent;
    preview.startFrameDrag(pointer(61));
    expect(preview.frame).toBe(1);
    preview.endFrameDrag();
    preview.moveFrameDrag(pointer(111));
    expect(preview.frame).toBe(1);
    expect(captured).toBe(false);
    preview.startFrameDrag(pointer(11));
    preview.moveFrameDrag(pointer(111, 0));
    expect(preview.frame).toBe(0);
    expect(captured).toBe(false);
    preview.scrubFrameInput({ target: { value: '2' } } as unknown as Event);
    expect(preview.frame).toBe(2);
    fixture.destroy();
  });
  it('steps one frame, pauses playback and stops at either end', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.animation = { format: 'LMB', fps: 15, frames: [[], [], []], warnings: [] };
    preview.playing = true;
    preview.stepFrame(1);
    expect(preview.frame).toBe(1);
    expect(preview.playing).toBe(false);
    preview.stepFrame(1);
    preview.stepFrame(1);
    expect(preview.frame).toBe(2);
    preview.stepFrame(-1);
    expect(preview.frame).toBe(1);
    preview.stepFrame(-1);
    preview.stepFrame(-1);
    expect(preview.frame).toBe(0);
    fixture.destroy();
  });
  it('changes playback timing without changing the decoded animation rate', () => {
    const fixture = TestBed.createComponent(AssetPreviewComponent);
    const preview = fixture.componentInstance;
    preview.animation = { format: 'LMB', fps: 15, frames: [[]], warnings: [] };
    preview.setPlaybackFps(15);
    expect(preview.frameDurationMs).toBeCloseTo(1000 / 15);
    preview.setPlaybackFps(30);
    expect(preview.frameDurationMs).toBeCloseTo(1000 / 30);
    expect(preview.animation.fps).toBe(15);
    preview.setPlaybackFps(1000);
    expect(preview.playbackFps).toBe(120);
    fixture.destroy();
  });
});
