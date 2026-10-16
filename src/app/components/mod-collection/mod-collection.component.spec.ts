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
    expect(page.querySelector('h3')?.textContent).toBe('Irongoon');

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
