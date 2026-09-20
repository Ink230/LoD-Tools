import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ModCollectionComponent } from './mod-collection.component';

describe('mod collection controls', () => {
  it('starts with all entries, filters by version, and restores the displayed selection on reset', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const select = page.querySelector<HTMLSelectElement>('select[aria-label="Severed Chains version"]');
    expect(select.value).toBe('');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(11);

    select.value = 'main.spike-testing';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(1);
    expect(page.querySelector('h3')?.textContent).toBe('Irongoon');

    page.querySelector('button')?.click();
    await fixture.whenStable();
    expect(select.value).toBe('');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(11);
  });

  it('searches tools as well as mods and preserves the combined entry and guide links', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('a[href$="Additional-Additions-Editor"]')).not.toBeNull();
    expect(page.querySelector('a[href$="en_setup.md"]')).not.toBeNull();
    expect(page.querySelector('a[href="/mods/irongoon"]')).not.toBeNull();

    const search = page.querySelector<HTMLInputElement>('input[type="search"]');
    search.value = 'DooMMetaL';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(5);
    expect(page.querySelectorAll('.tool-gallery app-mod-card')).toHaveLength(5);
  });
});
