import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateLagos, dateTimeLagos, fromLagosInput, lagosInputInHours, toLagosInput, when, yearLagos } from './time';

// Fixed moments (UTC). Lagos is always UTC+1.
const MON_1305_UTC = '2026-11-16T13:05:00Z'; // Mon 16 Nov, 14:05 in Lagos
const MON_2330_UTC = '2026-11-16T23:30:00Z'; // Tue 17 Nov, 00:30 in Lagos
const NEW_YEAR_EVE = '2026-12-31T23:30:00Z'; // already 2027 in Lagos

function checkAll() {
  expect(when(MON_1305_UTC)).toMatch(/^Mon,? 14:05$/);
  expect(when(MON_2330_UTC)).toMatch(/^Tue,? 00:30$/);
  expect(dateLagos(MON_2330_UTC)).toBe('17/11/2026');
  expect(dateTimeLagos(MON_1305_UTC)).toMatch(/^16\/11\/2026,? 14:05:00$/);
  expect(yearLagos(new Date(NEW_YEAR_EVE))).toBe(2027);
  expect(toLagosInput(MON_1305_UTC)).toBe('2026-11-16T14:05');
  expect(toLagosInput(MON_2330_UTC)).toBe('2026-11-17T00:30');
  expect(fromLagosInput('2026-11-16T14:05').toISOString()).toBe('2026-11-16T13:05:00.000Z');
  expect(fromLagosInput('2026-11-17T00:30').toISOString()).toBe('2026-11-16T23:30:00.000Z');
}

describe('Lagos time helpers (tests run with TZ=Africa/Lagos)', () => {
  it('formats and reads fixed dates in Lagos time', checkAll);

  it('round-trips a datetime-local value', () => {
    for (const v of ['2026-01-01T00:00', '2026-06-30T12:59', '2026-12-31T23:59']) {
      expect(toLagosInput(fromLagosInput(v))).toBe(v);
    }
  });

  it('gives an Invalid Date for empty or broken input', () => {
    expect(Number.isNaN(fromLagosInput('').getTime())).toBe(true);
    expect(Number.isNaN(fromLagosInput('tomorrow').getTime())).toBe(true);
  });

  it('builds default sale times hours from now', () => {
    expect(lagosInputInHours(3, Date.parse(MON_1305_UTC))).toBe('2026-11-16T17:05');
    expect(lagosInputInHours(12, Date.parse(MON_1305_UTC))).toBe('2026-11-17T02:05');
  });
});

// A phone set to another time zone must still see, and type, Lagos times
describe.each(['America/New_York', 'Asia/Tokyo', 'Europe/London', 'UTC'])('on a phone set to %s', (tz) => {
  afterEach(() => vi.unstubAllEnvs());

  it('still shows and reads Lagos time', () => {
    vi.stubEnv('TZ', tz);
    // Prove the time zone really changed, so this test cannot pass by accident
    expect(new Date(MON_1305_UTC).getHours()).not.toBe(14);
    checkAll();
  });
});
