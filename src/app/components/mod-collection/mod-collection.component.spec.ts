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
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(12);
    expect([...page.querySelectorAll('section:first-of-type app-mod-card h3')].map(heading => heading.textContent)).toEqual([
      'Dragoon Modifier', 'Irongoon', 'The Legend of Tides', 'Stardust Indicators', 'Image Upscaling', 'Additional Additions',
    ]);
    expect(page.querySelector('.section-heading .count')).toBeNull();

    select.value = 'Special build';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(1);
    expect(page.querySelector('h3')?.textContent).toBe('Irongoon');

    page.querySelector('button')?.click();
    await fixture.whenStable();
    expect(select.value).toBe('');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(12);

    select.value = 'RB3';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(6);
  });

  it('presents distinct Irongoon releases, linked authors, tags, and the unreleased upscale project', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const irongoon = page.querySelector('#mod-irongoon').closest('article');
    expect([...irongoon.querySelectorAll<HTMLAnchorElement>('a.release')].map(link => link.getAttribute('href'))).toEqual([
      'https://github.com/Ink230/irongoon/releases/tag/v0.4.16',
      'https://github.com/Ink230/irongoon/releases/tag/irongoon-future',
    ]);
    expect(irongoon.querySelector('.identity .compatibility').textContent).toBe('RB3');
    expect(irongoon.querySelector('a[href="/mods/irongoon"]').textContent).toContain('Configure v0.5.1');
    expect([...irongoon.querySelectorAll('.tags li')].map(tag => tag.textContent)).toEqual(['Full Campaign', 'Randomizer', 'QoL Minor', 'Extension']);
    expect(page.querySelector('a[href="https://github.com/avionanx"]').textContent).toBe('Icarus');
    expect(page.querySelector('a[href="https://ko-fi.com/monoxide"]').textContent).toBe('LordMonoxide');
    const upscale = page.querySelector('#mod-upscale').closest('article');
    expect(upscale.querySelector('a.release')).toBeNull();
    expect(upscale.querySelector('a[href="https://legendofdragoon.org/projects/image-upscaling/"]')).not.toBeNull();
    expect(upscale.textContent).toContain('In development');
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
