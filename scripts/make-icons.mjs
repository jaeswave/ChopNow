// Makes the app icons in public/icons from one drawing. Run: node scripts/make-icons.mjs
// Dark green square, a lighter circle, and "GJ" (G white, J gold). sharp is a dev dependency only;
// the PNGs are committed, so the website build does not need it.
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const LEAF = '#0E3B2C';
const CIRCLE = '#1C5A44';
const GOLD = '#F4B52E';
const OUT = new URL('../public/icons/', import.meta.url);

// circle: radius as a share of the icon. Maskable icons must keep everything inside the middle 80% (radius 40%).
function svg(size, { circle = 0.42, text = 0.34 } = {}) {
  const c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${LEAF}"/>
  <circle cx="${c}" cy="${c}" r="${size * circle}" fill="${CIRCLE}"/>
  <text x="${c}" y="${c}" dy="0.35em" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${size * text}" letter-spacing="${-size * 0.01}">
    <tspan fill="#FFFFFF">G</tspan><tspan fill="${GOLD}">J</tspan>
  </text>
</svg>`;
}

const icons = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { circle: 0.34, text: 0.27 }],
  ['apple-touch-icon.png', 180, {}],
  ['favicon-32.png', 32, { circle: 0.46, text: 0.42 }],
];

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('icon.svg', OUT), svg(512));
for (const [name, size, opts] of icons) {
  await sharp(Buffer.from(svg(size, opts))).png({ compressionLevel: 9 }).toFile(new URL(name, OUT).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log('made', name, size);
}
