import { describe, expect, it } from 'vitest';
import { INSTALL_CARD_GAP_DAYS, shouldShowInstallCard } from './Install';

const DAY = 864e5;
const NOW = Date.parse('2026-11-18T12:00:00Z');
const base = { now: NOW, lastShown: 0, citySaved: true, standalone: false, phone: true, canPrompt: true, ios: false };
const show = (over) => shouldShowInstallCard({ ...base, ...over });

describe('install card rule', () => {
  it('shows on an Android phone with the install prompt, once the city is answered', () => {
    expect(show({})).toBe(true);
  });

  it('shows the iPhone steps on an iPhone (there is no install prompt there)', () => {
    expect(show({ canPrompt: false, ios: true })).toBe(true);
  });

  it('waits until the city question is answered', () => {
    expect(show({ citySaved: false })).toBe(false);
  });

  it('shows at most once every 14 days', () => {
    expect(INSTALL_CARD_GAP_DAYS).toBe(14);
    expect(show({ lastShown: NOW - 1 * DAY })).toBe(false);
    expect(show({ lastShown: NOW - 13.9 * DAY })).toBe(false);
    expect(show({ lastShown: NOW - 14 * DAY })).toBe(true);
    expect(show({ lastShown: NOW - 30 * DAY })).toBe(true);
  });

  it('never shows inside the installed app, on a computer, or when nothing can be offered', () => {
    expect(show({ standalone: true })).toBe(false);
    expect(show({ phone: false })).toBe(false);
    expect(show({ canPrompt: false, ios: false })).toBe(false);
  });
});
