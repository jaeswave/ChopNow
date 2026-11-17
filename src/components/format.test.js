import { describe, expect, it } from 'vitest';
import { money, naira, pctOff, when } from './index';

describe('money', () => {
  it('shows whole naira with a thousands separator', () => {
    expect(money(2500)).toBe('₦2,500');
    expect(money(1250000)).toBe('₦1,250,000');
  });
  it('rounds kobo away, because prices are whole naira', () => {
    expect(money(2500.6)).toBe('₦2,501');
  });
  it('handles zero', () => {
    expect(money(0)).toBe('₦0');
  });
});

describe('naira', () => {
  it('formats amounts with the naira sign', () => {
    expect(naira(3500)).toBe('₦3,500');
  });
  it('accepts numbers that arrive as strings from forms', () => {
    expect(naira('12000')).toBe('₦12,000');
  });
});

describe('pctOff', () => {
  it('works out the whole-number discount', () => {
    expect(pctOff(5000, 3500)).toBe(30);
    expect(pctOff(3000, 1000)).toBe(67);
  });
});

describe('when', () => {
  it('shows the weekday and Lagos time (UTC+1, no daylight saving)', () => {
    // 13:05 UTC on Monday 16 Nov 2026 is 14:05 in Lagos
    expect(when('2026-11-16T13:05:00Z')).toMatch(/Mon.*14:05/);
  });
  it('rolls over to the next Lagos day just after 23:00 UTC', () => {
    expect(when(new Date('2026-11-16T23:30:00Z'))).toMatch(/Tue.*00:30/);
  });
  // Tests run with TZ=Africa/Lagos (see vite.config.js). when() does not yet force
  // Africa/Lagos itself, so a phone set to another time zone shows its own time.
  it.todo('shows Lagos time even when the device is in another time zone');
});
