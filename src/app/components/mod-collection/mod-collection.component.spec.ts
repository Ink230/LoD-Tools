import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModCollectionComponent } from './mod-collection.component';
import { MOD_CATALOG } from './mod-catalog';
import { ModReleasesService, applyLatestRelease } from './mod-releases.service';

describe('mod collection controls', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{
      provide: ModReleasesService,
      useFactory: () => ({ catalog: signal(MOD_CATALOG), status: signal(''), refresh: () => Promise.resolve() }),
    }] });
  });

  it('refreshes version labels and links and clears selections for uncached releases', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const select = page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]');
    select.click();
    await fixture.whenStable();
    const service = TestBed.inject(ModReleasesService);
    const updated = applyLatestRelease(MOD_CATALOG.find(mod => mod.id === 'irongoon'), {
      tag_name: 'v0.4.19', html_url: 'https://github.com/Ink230/irongoon/releases/tag/v0.4.19',
      name: 'v0.4.19 for RB3', body: '', draft: false, prerelease: false,
    });
    service.catalog.update(catalog => catalog.map(mod => mod.id === updated.id ? updated : mod));
    await fixture.whenStable();
    const card = page.querySelector('#mod-irongoon').closest('article');
    expect(card.querySelector('a.release')?.getAttribute('href')).toBe(updated.releases[0].url);
    expect(card.querySelector('a.release')?.textContent).toContain('v0.4.19');
    expect(card.querySelector<HTMLInputElement>('input[type="checkbox"]').disabled).toBe(true);
    expect(card.querySelector<HTMLInputElement>('input[type="checkbox"]').checked).toBe(false);
    expect(card.textContent).toContain('not available in the combined ZIP yet');
    expect(card.textContent).not.toContain('v0.4.18 supports SC RB3');
    expect(fixture.componentInstance.selected().size).toBe(0);
    expect(page.querySelector<HTMLButtonElement>('[aria-label="Download Mods"]').disabled).toBe(true);
  });

  it('navigates the five extraction screenshots in order without wrapping', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const previous = page.querySelector<HTMLButtonElement>('[aria-label="Previous extraction image"]');
    const next = page.querySelector<HTMLButtonElement>('[aria-label="Next extraction image"]');
    expect(previous.disabled).toBe(true);
    for (let index = 1; index <= 5; index++) {
      expect(page.querySelector('.extraction-image img')?.getAttribute('src')).toBe(`/assets/mod-installation/step-0${index}.jpg`);
      expect(page.querySelector('.extraction-image')?.getAttribute('href')).toBe(`/assets/mod-installation/step-0${index}.jpg`);
      expect(page.querySelector('.extraction-caption span')?.textContent).toBe(`Image ${index} of 5`);
      if (index < 5) {
        next.click();
        await fixture.whenStable();
      }
    }
    expect(next.disabled).toBe(true);
    previous.click();
    await fixture.whenStable();
    expect(page.querySelector('.extraction-caption span')?.textContent).toBe('Image 4 of 5');
  });

  it('keeps selections across filters and clears all selected mods', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const checkbox = page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]');
    expect(page.querySelectorAll('input[type="checkbox"]')).toHaveLength(16);
    expect(page.querySelector<HTMLInputElement>('[aria-label="Select Lloyd Mod"]').disabled).toBe(true);
    expect(page.querySelector<HTMLInputElement>('[aria-label="Select Upscale Mod"]').disabled).toBe(true);
    checkbox.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected().has('irongoon')).toBe(true);
    fixture.componentInstance.query.set('No Stats');
    await fixture.whenStable();
    expect(page.querySelector('[aria-label="Select Irongoon"]')).toBeNull();
    expect(page.querySelector('.selection-count')?.textContent).toBe('1 selected');
    fixture.componentInstance.clearFilters();
    await fixture.whenStable();
    expect(page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]').checked).toBe(true);
    page.querySelector<HTMLButtonElement>('[aria-label="Clear all selections"]').click();
    await fixture.whenStable();
    expect(page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]').checked).toBe(false);
    expect(page.querySelector<HTMLButtonElement>('[aria-label="Download Mods"]').disabled).toBe(true);
  });

  it('shows a spinner during download and keeps selections when the download fails', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]').click();
    await fixture.whenStable();
    const fetchAsset = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network unavailable'));
    try {
      const download = fixture.componentInstance.downloadMods();
      fixture.detectChanges();
      expect(page.querySelector('.spinner')).not.toBeNull();
      expect(page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]').disabled).toBe(true);
      await download;
      await fixture.whenStable();
      expect(page.querySelector('.spinner')).toBeNull();
      expect(page.querySelector('[role="alert"]')?.textContent).toContain('Network unavailable');
      expect(page.querySelector<HTMLInputElement>('[aria-label="Select Irongoon"]').checked).toBe(true);
      expect(page.querySelector<HTMLButtonElement>('[aria-label="Download Mods"]').disabled).toBe(false);
    } finally {
      fetchAsset.mockRestore();
    }
  });

  it('starts with all entries, filters by version, and restores the displayed selection on reset', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const select = page.querySelector<HTMLButtonElement>('[role="combobox"][aria-label="Severed Chains version"]');
    const chooseVersion = async (label: string) => {
      select.click();
      await fixture.whenStable();
      [...page.querySelectorAll<HTMLButtonElement>('[role="option"]')].find(option => option.textContent.trim() === label).click();
      await fixture.whenStable();
    };
    expect(select.textContent.trim()).toBe('All versions');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(16);
    expect([...page.querySelectorAll('section:first-of-type app-mod-card h3')].map(heading => heading.textContent)).toEqual([
      'Dragoon Modifier', 'Irongoon', 'The Legend of Tides', 'Lloyd Mod', 'Additional Additions', 'Stardust Indicators',
    ]);
    expect([...page.querySelectorAll('section[aria-labelledby="top-rated-title"] .mod-grid app-mod-card h3')].map(heading => heading.textContent)).toEqual([
      'Archipelago', 'Upscale Mod', 'Icon Turn Order', 'Battle Rewards', 'No Stats',
    ]);
    expect(page.querySelector('.section-heading .count')).toBeNull();

    await chooseVersion('Special build');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(1);
    expect(page.querySelector('app-mod-card h3')?.textContent).toBe('Irongoon');

    page.querySelector<HTMLButtonElement>('.results button')?.click();
    await fixture.whenStable();
    expect(select.textContent.trim()).toBe('All versions');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(16);

    await chooseVersion('RB3');
    expect(page.querySelectorAll('app-mod-card')).toHaveLength(9);
    expect(page.querySelector('#mod-lloyd')).not.toBeNull();
  });

  it('presents distinct Irongoon releases, linked authors, tags, and the unreleased upscale project', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const irongoon = page.querySelector('#mod-irongoon').closest('article');
    expect([...irongoon.querySelectorAll<HTMLAnchorElement>('a.release')].map(link => link.getAttribute('href'))).toEqual([
      'https://github.com/Ink230/irongoon/releases/tag/v0.4.18',
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
    expect(upscale.querySelector('.tags li').textContent).toBe('Graphics');
  });

  it('shows Lloyd credits and disabled pending links and links the new community mods', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const lloyd = page.querySelector('#mod-lloyd').closest('article');

    expect(lloyd.textContent).toContain('Lloyd joins your party as a playable character with full additions and dspells.');
    expect(lloyd.querySelector('.author a')?.getAttribute('href')).toBe('https://github.com/Zychronix');
    expect(lloyd.querySelector('.author a')?.textContent).toBe('Zychronix');
    expect(lloyd.querySelector('.identity .compatibility')?.textContent).toBe('RB3');
    expect(lloyd.querySelector('.release[aria-disabled="true"]')?.textContent).toBe('RB3 • unknown');
    expect(lloyd.querySelector('.info-links [aria-disabled="true"]')?.textContent).toContain('More info');
    expect(lloyd.querySelector('.actions a')).toBeNull();
    for (const [id, infoUrl, releaseUrl] of [
      ['icon-turn-order', 'https://github.com/Zychronix/icon-turn-order', 'https://github.com/Zychronix/icon-turn-order/releases/tag/1.3'],
      ['battle-rewards', 'https://github.com/DennytXVII/BattleRewardsMod', 'https://github.com/DennytXVII/BattleRewardsMod/releases'],
      ['no-stats', 'https://github.com/Popoto-anonymous/No-Stats', 'https://github.com/Popoto-anonymous/No-Stats/releases/tag/Y2'],
    ]) {
      const card = page.querySelector('#mod-' + id).closest('article');
      expect(card.querySelector('.info-links a')?.getAttribute('href')).toBe(infoUrl);
      expect(card.querySelector('a.release')?.getAttribute('href')).toBe(releaseUrl);
    }
    expect(page.querySelector('#mod-no-stats').closest('article').textContent).toContain('Check compatibility');
    expect(page.querySelector('#mod-no-stats').closest('article').querySelector('a.release')?.textContent).toContain('v1.1');
    const dragoonModifier = page.querySelector('#mod-dragoon-modifier').closest('article');
    expect(dragoonModifier.querySelector('a.release')?.getAttribute('href')).toBe('https://github.com/Legend-of-Dragoon-Modding/sc-dragoon-modifier/releases/tag/v2.2.0');
    expect(dragoonModifier.querySelector('a.release')?.textContent).toContain('RB3 · v2.2.0');
  });

  it('supports keyboard selection, Escape, and outside clicks in the styled filters', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ModCollectionComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const sort = page.querySelector<HTMLButtonElement>('[aria-label="Sort mods"]');
    sort.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    expect(sort.getAttribute('aria-expanded')).toBe('true');
    sort.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.sort()).toBe('name');
    sort.click();
    await fixture.whenStable();
    sort.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(sort.getAttribute('aria-expanded')).toBe('false');
    sort.click();
    await fixture.whenStable();
    document.body.click();
    await fixture.whenStable();
    expect(sort.getAttribute('aria-expanded')).toBe('false');
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
