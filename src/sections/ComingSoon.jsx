import { Link } from 'react-router-dom';
import Waitlist from '../components/Waitlist';
import usePageMeta from '../hooks/usePageMeta';
import { useRules } from '../hooks/useMeta';
import { Button, Container } from '../ui';

const STEPS = [
  ['🔎', 'Find a deal near you.'],
  ['💳', 'Reserve it online.'],
  ['🛍️', 'Collect it with a 6-digit code.'],
];

// The home page while VITE_COMING_SOON=true, for visitors and buyers
export function ComingSoonHome() {
  const r = useRules();
  usePageMeta('GbaanJo | Great food, fewer naira, Lagos', `GbaanJo helps you find great food from Lagos kitchens at least ${r.minDiscount}% off. Join the waitlist.`, { fullTitle: true });
  return (
    <>
      <section className="bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
        <Container className="grid items-center gap-8 py-8 sm:py-12 md:grid-cols-[1.1fr_.9fr] md:gap-10 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-palm">
              <span aria-hidden="true">📍</span> Coming soon to Lagos
            </p>
            <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Surprise your taste buds. <span className="whitespace-nowrap text-palm">Pay less.</span>
            </h1>
            <p className="mt-4 max-w-xl text-white/85 sm:text-lg">
              Great food from Lagos kitchens, <strong className="font-bold text-white">at least {r.minDiscount}% off</strong>, ready to collect near you. We are opening very soon.
            </p>
            <Button as={Link} to="/sell-with-us" variant="ghost" size="lg" className="mt-5 w-full sm:w-auto">
              I run a food business
            </Button>
          </div>
          <Waitlist tone="dark" />
        </Container>
      </section>
      <section aria-labelledby="soon-how">
        <Container className="py-8">
          <h2 id="soon-how" className="text-xl font-extrabold sm:text-3xl">How it will work</h2>
          <ol className="mt-3 grid divide-y divide-line rounded-2xl bg-white ring-[1.5px] ring-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STEPS.map(([e, t]) => (
              <li key={t} className="flex items-center gap-3 p-4">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-palm/30 text-lg">{e}</span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}

// Shown instead of /deals and listing pages while VITE_COMING_SOON=true, for visitors and buyers
export function OpeningSoonPage() {
  const r = useRules();
  usePageMeta('We are opening soon', `GbaanJo helps you find great food from Lagos kitchens at least ${r.minDiscount}% off. Join the waitlist.`);
  return (
    <div className="mx-auto grid max-w-lg gap-5 text-center">
      <div className="text-6xl" aria-hidden="true">🍲</div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">We are opening soon</h1>
      <p className="text-mute">Deals from Lagos kitchens, at least {r.minDiscount}% off, are on their way. Join the waitlist and we will email you the day we open.</p>
      <Waitlist className="text-left" />
      <Link to="/how-it-works" className="font-semibold text-leaf underline underline-offset-4">How GbaanJo works</Link>
    </div>
  );
}
