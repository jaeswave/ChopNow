// Finding out which city someone is in. Everything here is a HINT. The person always confirms.

const KEY = 'gj_city';
export const getSavedCity = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const saveCity = (c) => { try { localStorage.setItem(KEY, c); } catch { /* private mode: we will just ask again next time */ } };

// Lagos State, roughly (a box around it). Used only with the phone's GPS.
const LAGOS = { minLat: 6.37, maxLat: 6.7, minLng: 2.7, maxLng: 4.35 };
export const inLagos = (lat, lng) => lat >= LAGOS.minLat && lat <= LAGOS.maxLat && lng >= LAGOS.minLng && lng <= LAGOS.maxLng;

// 1. From the internet address (needs no permission, works instantly, but can be wrong on phone networks)
export async function guessCityFromIP() {
  try {
    const r = await fetch('/api/geo', { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.country) return null; // not running on Vercel (for example on your own computer)
    const lagos = d.country === 'NG' && (/lagos/i.test(d.city || '') || (d.region || '').toUpperCase() === 'LA');
    return { inLagos: lagos, city: d.city, country: d.country };
  } catch { return null; }
}

// 2. From the phone's GPS (asks permission, much more accurate)
export function guessCityFromGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ inLagos: inLagos(p.coords.latitude, p.coords.longitude) }),
      () => resolve(null),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
}
