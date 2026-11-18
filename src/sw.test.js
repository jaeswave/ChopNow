import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Run public/sw.js against a stand-in `self`, then test its decision function (what it may touch).
function loadWorker() {
  const listeners = {};
  const self = { location: { origin: 'https://www.gbaanjo.com' }, addEventListener: (type, fn) => (listeners[type] = fn) };
  new Function('self', readFileSync('public/sw.js', 'utf8'))(self);
  return { decide: self.__gjDecide, listeners };
}
const { decide, listeners } = loadWorker();
const ORIGIN = 'https://www.gbaanjo.com';
const req = (url, { method = 'GET', mode = 'cors', auth } = {}) => ({
  url,
  method,
  mode,
  headers: new Headers(auth ? { Authorization: 'Bearer ' + auth } : {}),
});

describe('service worker', () => {
  it('listens for install, activate and fetch', () => {
    expect(Object.keys(listeners).sort()).toEqual(['activate', 'fetch', 'install']);
  });

  it('never touches the API (another origin)', () => {
    expect(decide(req('https://gbaanjo-api.onrender.com/listings'), ORIGIN)).toBeNull();
    expect(decide(req('https://gbaanjo-api.onrender.com/auth/me', { auth: 'x' }), ORIGIN)).toBeNull();
  });

  it('never touches other websites: Cloudinary, OPay, Resend', () => {
    for (const url of ['https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 'https://sandboxapi.opaycheckout.com/api/v1/x', 'https://api.resend.com/emails']) {
      expect(decide(req(url), ORIGIN), url).toBeNull();
    }
  });

  it('never touches POST or other non-GET requests, even on our own site', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(decide(req(ORIGIN + '/assets/index-abc.js', { method }), ORIGIN), method).toBeNull();
      expect(decide(req(ORIGIN + '/deals', { method, mode: 'navigate' }), ORIGIN), method).toBeNull();
    }
  });

  it('never touches anything sent with a login', () => {
    expect(decide(req(ORIGIN + '/assets/index-abc.js', { auth: 'secret' }), ORIGIN)).toBeNull();
  });

  it('leaves our own Vercel functions alone', () => {
    expect(decide(req(ORIGIN + '/api/geo'), ORIGIN)).toBeNull();
  });

  it('keeps built files, icons, the manifest and Google Fonts', () => {
    expect(decide(req(ORIGIN + '/assets/index-abc.js'), ORIGIN)).toBe('cache');
    expect(decide(req(ORIGIN + '/icons/icon-192.png'), ORIGIN)).toBe('cache');
    expect(decide(req(ORIGIN + '/manifest.webmanifest'), ORIGIN)).toBe('cache');
    expect(decide(req('https://fonts.gstatic.com/s/dmsans/v17/x.woff2'), ORIGIN)).toBe('cache');
  });

  it('opens pages from the network and falls back to the offline page', () => {
    expect(decide(req(ORIGIN + '/deals', { mode: 'navigate' }), ORIGIN)).toBe('page');
  });

  it('leaves other files on our site alone', () => {
    expect(decide(req(ORIGIN + '/sitemap.xml'), ORIGIN)).toBeNull();
    expect(decide(req(ORIGIN + '/images/demo/deal-1.webp'), ORIGIN)).toBeNull();
  });
});
