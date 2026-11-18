import { Link } from 'react-router-dom';
import { useRules } from '../hooks/useMeta';
import { Button, Container, cx, tapText } from '../ui';

// Compact rows inside one card on phones, three cards side by side on wider screens
const list = 'mt-3 grid divide-y divide-line rounded-2xl bg-white ring-[1.5px] ring-line sm:grid-cols-3 sm:divide-x sm:divide-y-0';
const item = 'flex gap-3 p-3 sm:p-4';
const icon = 'grid size-9 shrink-0 place-items-center rounded-xl bg-palm/30 text-lg';

// Three steps, with a link to the full /how-it-works page
export function MiniExplainer() {
  const r = useRules();
  const steps = [
    ['🔎', 'Find a deal', `Pick something near you, at least ${r.minDiscount}% off.`],
    ['💳', 'Pay online', 'Pay securely and get a 6-digit pickup code.'],
    ['🛍️', 'Collect', 'Show your code and take your food home.'],
  ];
  return (
    <section aria-labelledby="how-title">
      <Container className="py-6">
        <div className="flex items-end justify-between gap-3">
          <h2 id="how-title" className="text-xl font-extrabold sm:text-3xl">How it works</h2>
          <Link to="/how-it-works" className={cx(tapText, 'font-semibold text-leaf underline underline-offset-4')}>Learn more</Link>
        </div>
        <ol className={list}>
          {steps.map(([e, t, d], i) => (
            <li key={t} className={item}>
              <span aria-hidden="true" className={icon}>{e}</span>
              <div>
                <h3 className="font-semibold"><span className="sr-only">Step {i + 1}: </span>{t}</h3>
                <p className="text-sm text-mute">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function TrustStrip() {
  const points = [
    ['✅', 'Verified businesses', 'Every seller is checked against CAC records.'],
    ['🔒', 'Secure online payment', 'Pay securely online with OPay.'],
    ['🔢', 'Your code protects your order', 'Food is only handed over when your code matches.'],
  ];
  return (
    <section aria-labelledby="trust-title" className="bg-leaf/5">
      <Container className="py-6">
        <h2 id="trust-title" className="text-xl font-extrabold sm:text-3xl">Safe for buyers and sellers</h2>
        <ul className={list}>
          {points.map(([e, t, d]) => (
            <li key={t} className={item}>
              <span aria-hidden="true" className={icon}>{e}</span>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm text-mute">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function BusinessTeaser() {
  return (
    <section aria-labelledby="biz-title">
      <Container className="py-6">
        <div className="rounded-3xl bg-palm p-5 text-[#2a1d00] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h2 id="biz-title" className="text-xl font-extrabold sm:text-3xl">Run a food business?</h2>
            <p className="mt-2 max-w-lg">Sell what is left at the end of the day instead of throwing it away. Listing is free.</p>
          </div>
          <Button as={Link} to="/sell-with-us" variant="leaf" size="lg" className="mt-4 w-full shrink-0 sm:mt-0 sm:w-auto">
            Sell with us
          </Button>
        </div>
      </Container>
    </section>
  );
}
