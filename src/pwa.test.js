import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { addHeadTags } from './pwa';

// Files are read from the project root (tests run from there)
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

describe('manifest.webmanifest', () => {
  it('has the required fields', () => {
    expect(manifest).toMatchObject({
      name: 'GbaanJo',
      short_name: 'GbaanJo',
      display: 'standalone',
      start_url: '/?source=app',
      scope: '/',
      theme_color: '#0E3B2C',
      background_color: '#0E3B2C',
    });
  });

  it('lists 192 and 512 icons and a maskable 512, and the files are real PNGs of that size', async () => {
    const find = (sizes, purpose) => manifest.icons.find((i) => i.sizes === sizes && i.purpose === purpose);
    for (const [sizes, purpose] of [['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable']]) {
      const icon = find(sizes, purpose);
      expect(icon, `${sizes} ${purpose}`).toBeTruthy();
      expect(icon.type).toBe('image/png');
      const file = 'public' + icon.src;
      expect(existsSync(file), file).toBe(true);
      const { width, height, format } = await sharp(file).metadata();
      expect(`${width}x${height}`).toBe(sizes);
      expect(format).toBe('png');
    }
  });

  it('has an iPhone home-screen icon', async () => {
    const { width, height } = await sharp('public/icons/apple-touch-icon.png').metadata();
    expect([width, height]).toEqual([180, 180]);
  });
});

describe('addHeadTags', () => {
  it('adds the app tags once and sets viewport-fit=cover', () => {
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1">';
    addHeadTags();
    addHeadTags(); // calling it twice must not duplicate anything
    expect(document.head.querySelectorAll('link[rel="manifest"]')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="manifest"]').getAttribute('href')).toBe('/manifest.webmanifest');
    expect(document.head.querySelector('meta[name="theme-color"]').content).toBe('#0E3B2C');
    expect(document.head.querySelector('meta[name="apple-mobile-web-app-capable"]').content).toBe('yes');
    expect(document.head.querySelector('link[rel="apple-touch-icon"]').getAttribute('href')).toBe('/icons/apple-touch-icon.png');
    expect(document.head.querySelector('meta[name="viewport"]').content).toBe('width=device-width, initial-scale=1, viewport-fit=cover');
  });

  it('keeps tags that are already there', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#123456"><meta name="viewport" content="width=device-width, viewport-fit=cover">';
    addHeadTags();
    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[name="theme-color"]').content).toBe('#123456');
    expect(document.head.querySelector('meta[name="viewport"]').content).toBe('width=device-width, viewport-fit=cover');
  });
});

describe('vercel.json', () => {
  const rewrite = new RegExp('^' + vercel.rewrites[0].source + '$');
  const headersFor = (path) =>
    Object.fromEntries(
      vercel.headers
        // Vercel patterns here are plain paths or "(.*)": escape the dots, keep the wildcard
        .filter((h) => new RegExp('^' + h.source.split('(.*)').map((part) => part.replace(/\./g, '\\.')).join('.*') + '$').test(path))
        .flatMap((h) => h.headers.map((x) => [x.key, x.value])),
    );

  it('sends app routes to index.html but not /api, /assets or /icons', () => {
    for (const p of ['/', '/deals', '/account', '/listing/7']) expect(rewrite.test(p), p).toBe(true);
    for (const p of ['/api/geo', '/assets/index-abc.js', '/icons/icon-192.png']) expect(rewrite.test(p), p).toBe(false);
  });

  it('never caches sw.js and serves the manifest with the right type', () => {
    expect(headersFor('/sw.js')['Cache-Control']).toMatch(/no-store/);
    expect(headersFor('/manifest.webmanifest')['Content-Type']).toBe('application/manifest+json');
  });

  it('sends the security headers on every page, and no Content-Security-Policy yet', () => {
    const h = headersFor('/deals');
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(h['Permissions-Policy']).toMatch(/^geolocation=\(self\)/);
    expect(h['Permissions-Policy']).not.toMatch(/geolocation=\*/);
    expect(h['Content-Security-Policy']).toBeUndefined();
  });
});

