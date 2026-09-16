import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AssetPreviewComponent } from './asset-preview.component';

describe('animation playback speed', () => {
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
