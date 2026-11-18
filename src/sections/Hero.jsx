import { Link } from 'react-router-dom';
import { ART } from '../components';
import { useMeta, useRules } from '../hooks/useMeta';
import { Button, Container, cx, tap } from '../ui';
import jollof480Avif from '../assets/hero/jollof-480.avif';
import jollof800Avif from '../assets/hero/jollof-800.avif';
import jollof480Webp from '../assets/hero/jollof-480.webp';
import jollof800Webp from '../assets/hero/jollof-800.webp';

export const HERO_ALT = 'A takeaway pack of jollof rice with grilled chicken and fried plantain';

// Screens narrower than this get no picture, so the button stays near the top and no data is spent on it
export const HERO_MIN_WIDTH = 360;
// A 1 x 1 transparent GIF written into the page: on small screens the browser "loads" this instead of the photo
const NO_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// The main picture: loads first (not lazy), has a fixed size so nothing jumps, AVIF with a WebP fallback.
// Hidden below 360px wide (and not downloaded there).
function HeroPicture({ minDiscount }) {
  const sizes = '(min-width: 768px) 45vw, 100vw';
  return (
    <div className="relative mx-auto w-full max-w-md max-[360px]:hidden md:max-w-none">
      <picture>
        <source media={`(max-width: ${HERO_MIN_WIDTH - 1}px)`} srcSet={NO_IMAGE} />
        <source type="image/avif" srcSet={`${jollof480Avif} 480w, ${jollof800Avif} 800w`} sizes={sizes} />
        <img
          src={jollof800Webp}
          srcSet={`${jollof480Webp} 480w, ${jollof800Webp} 800w`}
          sizes={sizes}
          width="800"
          height="600"
          alt={HERO_ALT}
          loading="eager"
          // React 18 only knows the lowercase spelling (fetchPriority prints a warning); browsers read both
          // eslint-disable-next-line react/no-unknown-property
          fetchpriority="high"
          decoding="async"
          className="aspect-[16/10] w-full rounded-3xl object-cover shadow-2xl shadow-black/30 ring-4 ring-white/10 md:aspect-[4/3] md:rotate-2"
        />
      </picture>
      {/* A playful sticker; the same promise is in the text, so screen readers skip it */}
      <span aria-hidden="true" className="absolute -left-2 -top-3 rotate-[-8deg] rounded-full bg-pepper px-4 py-2 font-display text-lg font-extrabold text-white shadow-lg md:-left-4 md:text-xl">
        {minDiscount}%+ off
      </span>
    </div>
  );
}

// Big playful headline, Lagos, the real categories, one main button, and the picture
export default function Hero() {
  const { categories } = useMeta();
  const r = useRules();
  return (
    <section className="overflow-hidden bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
      <Container className="grid items-center gap-8 py-8 sm:py-12 md:grid-cols-[1.1fr_.9fr] md:gap-10 lg:py-16">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-palm">
            <span aria-hidden="true">📍</span> Live in Lagos
          </p>
          <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Surprise your taste buds. <span className="whitespace-nowrap text-palm">Pay less.</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/85 sm:text-lg">
            Great food from Lagos kitchens, <strong className="font-bold text-white">at least {r.minDiscount}% off</strong>, ready to collect near you.
          </p>
          <Button as={Link} to="/deals" variant="palm" size="lg" className="mt-5 w-full sm:w-auto">
            See live deals
          </Button>
          <nav aria-label="Categories" className="mt-6">
            <p className="text-sm text-white/75">Browse {categories.length} categories</p>
            <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 [scrollbar-width:none]">
              {categories.map((c) => (
                <li key={c} className="shrink-0">
                  <Link
                    to={'/deals?category=' + encodeURIComponent(c)}
                    className={cx(tap, 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-palm')}
                  >
                    {ART[c] && <span aria-hidden="true">{ART[c][0]}</span>}
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <HeroPicture minDiscount={r.minDiscount} />
      </Container>
    </section>
  );
}
