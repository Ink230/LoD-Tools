import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FastRouterLinkDirective } from './fast-router-link.directive';

@Component({ template: '' })
class DestinationComponent {}

@Component({ imports: [FastRouterLinkDirective], template: '<a fastRouterLink="/mods">Mods</a><a fastRouterLink="/mods" target="_blank">New tab</a>' })
class LinksComponent {}

describe('fast router links', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'mods', component: DestinationComponent }])] }));

  it('publishes a real href and supports the click event used by Enter and browser agents', async () => {
    const fixture = TestBed.createComponent(LinksComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const anchor = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(anchor.getAttribute('href')).toBe('/mods');
    anchor.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/mods');
  });

  it('retains early mouse navigation and leaves modified clicks to the browser', async () => {
    const fixture = TestBed.createComponent(LinksComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    for (const event of [new MouseEvent('mousedown', { button: 1 }), new MouseEvent('mousedown', { ctrlKey: true }), new MouseEvent('mousedown', { metaKey: true })]) {
      anchors[0].dispatchEvent(event);
    }
    anchors[1].dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    expect(navigate).not.toHaveBeenCalled();
    const event = new MouseEvent('mousedown', { button: 0, cancelable: true });
    anchors[0].dispatchEvent(event);
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/mods');
  });
});
