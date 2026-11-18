import { Link } from 'react-router-dom';
import { ART } from '../components';
import { useMeta, useRules } from '../hooks/useMeta';
import { Button, Container, cx, tap } from '../ui';

// One promise, Lagos, the real categories and one main button
export default function Hero() {
  const { categories } = useMeta();
  const r = useRules();
  return (
    <section className="bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
      <Container className="py-8 sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-palm">
          <span aria-hidden="true">📍</span> Live in Lagos
        </p>
        <h1 className="mt-4 max-w-3xl text-[2rem] font-extrabold leading-[1.08] sm:text-6xl">
          Good food, at least <span className="text-palm">{r.minDiscount}% off</span>, before it goes to waste.
        </h1>
        <p className="mt-3 max-w-xl text-white/85 sm:text-lg">
          Lagos kitchens, bakeries and shops sell what is left at the end of the day. Pay online, then collect with a 6-digit code.
        </p>
        <Button as={Link} to="/deals" variant="palm" size="lg" className="mt-5 w-full sm:w-auto">
          See live deals
        </Button>
        <nav aria-label="Categories" className="mt-6">
          <p className="text-sm text-white/75">Browse {categories.length} categories</p>
          <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 [scrollbar-width:none]">
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
      </Container>
    </section>
  );
}
