// Makes the home-page hero picture in modern, compressed formats. Run: node scripts/make-hero.mjs
// Source: scripts/source/hero-jollof.webp (1000 x 750, recovered from the old hero). Output: src/assets/hero/
// AVIF is smallest; WebP is the fallback for browsers without AVIF. Two widths so phones download less.
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const src = fileURLToPath(new URL('./source/hero-jollof.webp', import.meta.url));
const out = fileURLToPath(new URL('../src/assets/hero/', import.meta.url));
mkdirSync(out, { recursive: true });

for (const width of [480, 800]) {
  for (const [ext, opts] of [['avif', { quality: 50, effort: 6 }], ['webp', { quality: 72, effort: 6 }]]) {
    const file = `${out}jollof-${width}.${ext}`;
    await sharp(src).resize({ width })[ext](opts).toFile(file);
    console.log(`jollof-${width}.${ext}`, Math.round(statSync(file).size / 1024) + ' KB');
  }
}
