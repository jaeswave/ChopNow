/* GbaanJo service worker.
 * - Keeps the app's own built files (hashed /assets, icons, manifest, Google Fonts) so the app opens fast.
 * - Shows /offline.html when a page cannot load because there is no internet.
 * - NEVER touches the API, other websites (Cloudinary, OPay, Resend...), POST requests or anything with a login.
 * Bump VERSION to throw away old caches.
 */
const VERSION = 'gj-v1';
const PRECACHE = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// What to do with a request: 'page' (network first, offline page if that fails), 'cache' (cache first),
// or null (leave it alone: the browser handles it exactly as if there were no service worker).
function decide(request, origin) {
  if (request.method !== 'GET') return null; // POST, PATCH...: never
  if (request.headers.get('authorization')) return null; // anything with a login
  const url = new URL(request.url);
  if (url.origin !== origin) return FONT_HOSTS.includes(url.hostname) ? 'cache' : null; // API, Cloudinary, OPay...
  if (url.pathname.startsWith('/api/')) return null; // our own Vercel functions
  if (request.mode === 'navigate') return 'page';
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') return 'cache';
  return null;
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

async function pageOrOffline(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('/offline.html')) || new Response('You are offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const how = decide(event.request, self.location.origin);
  if (how === 'page') event.respondWith(pageOrOffline(event.request));
  else if (how === 'cache') event.respondWith(cacheFirst(event.request));
});

// For the tests (src/sw.test.js)
self.__gjDecide = decide;
