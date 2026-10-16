import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BrowserAgentService } from '../../services/browser-agent.service';
import { AppComponent } from './app.component';

@Component({ template: '' })
class PageComponent {}

describe('shell skip link', () => {
  it('preserves the current route and query instead of resolving against the root base URL', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'mods', component: PageComponent }]), { provide: BrowserAgentService, useValue: {} }] });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.autoDetectChanges();
    await TestBed.inject(Router).navigateByUrl('/mods?q=lloyd&sort=name#mod-lloyd');
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector('.skip-link');
    expect(link.getAttribute('href')).toBe('/mods?q=lloyd&sort=name#page-content');
    expect((fixture.nativeElement as HTMLElement).querySelector('#page-content')?.getAttribute('tabindex')).toBe('-1');
  });
});
