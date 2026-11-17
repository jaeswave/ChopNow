// Every date and time on the site is shown, and typed, in Lagos time, whatever time zone the phone is set to.
export const TIME_ZONE = 'Africa/Lagos';
export const LOCALE = 'en-NG';
const LAGOS_OFFSET_MS = 60 * 60 * 1000; // UTC+1 all year. Nigeria has no daylight saving.

// formatLagos(date, Intl options): any date or ISO string, formatted in Lagos time
export const formatLagos = (d, options) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(new Date(d));

// "Mon 14:05": short day and time, used for pickup and collection times
export const when = (d) => formatLagos(d, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

// "16/11/2026"
export const dateLagos = (d) => formatLagos(d, { year: 'numeric', month: 'numeric', day: 'numeric' });

// "16/11/2026, 14:05:00"
export const dateTimeLagos = (d) =>
  formatLagos(d, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

// The current year in Lagos (for the footer)
export const yearLagos = (d = new Date()) => Number(formatLagos(d, { year: 'numeric' }));

/* ---------- <input type="datetime-local"> values ("2026-11-16T14:05") ---------- */
const pad = (n) => String(n).padStart(2, '0');

// A moment in time → the value a Lagos clock shows, for a datetime-local input
export function toLagosInput(d) {
  const t = new Date(new Date(d).getTime() + LAGOS_OFFSET_MS); // read the UTC fields of this as Lagos fields
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

// What the seller typed, read as Lagos time → a real moment (Date). Invalid input gives an Invalid Date.
export function fromLagosInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - LAGOS_OFFSET_MS);
}

// Lagos input value for `hours` from now
export const lagosInputInHours = (hours, from = Date.now()) => toLagosInput(from + hours * 36e5);
