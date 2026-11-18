import { useState } from 'react';
import { Link } from 'react-router-dom';
import Faq from '../components/Faq';
import Steps from '../components/Steps';
import { monthlyRecovered } from '../components/fees';
import { useMeta, useRules } from '../hooks/useMeta';
import { Button, Field, Input } from '../ui';
import { sellerFaq } from './sellerFaq';

const APPLY = '/auth?mode=register&role=SELLER';
const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line sm:p-8';

// Estimate only: every number about fees comes from the server's rules
function Calculator({ r, money }) {
  const [v, setV] = useState({ portions: '10', price: '3000', discount: String(Math.max(r.minDiscount, 40)) });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, '') });
  const tooSmall = Number(v.discount) < r.minDiscount;
  const est = monthlyRecovered({ ...v, discount: tooSmall ? r.minDiscount : v.discount }, r);

  return (
    <section aria-labelledby="calc-title" className={box}>
      <h2 id="calc-title" className="text-2xl font-extrabold">What could you recover?</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Portions left over per day"><Input inputMode="numeric" value={v.portions} onChange={set('portions')} /></Field>
        <Field label="Normal price (₦)"><Input inputMode="numeric" value={v.price} onChange={set('price')} /></Field>
        <Field label="Discount (%)" hint={`At least ${r.minDiscount}%`}><Input inputMode="numeric" value={v.discount} onChange={set('discount')} /></Field>
      </div>
      {tooSmall && <p className="mt-3 rounded-xl bg-palm/25 p-3 text-sm font-semibold">Deals must be at least {r.minDiscount}% off, so the estimate uses {r.minDiscount}%.</p>}
      <div aria-live="polite" className="mt-5 rounded-2xl bg-leaf p-5 text-white">
        <p className="text-sm text-white/80">Estimated money recovered per month, after GbaanJo's fee</p>
        <p className="font-display text-4xl font-extrabold text-palm" data-testid="calc-total">{money(est.perMonth)}</p>
        <p className="mt-2 text-sm text-white/80">
          Each portion sells for {money(est.salePrice)}, GbaanJo keeps {money(est.feeEach)}, you get {money(est.salePrice - est.feeEach)}. That is {money(est.perDay)} a day.
        </p>
      </div>
      <p className="mt-3 text-sm text-mute">
        This is an estimate, not a promise. It assumes every portion sells, each as its own order, for {est.days} days. Real sales depend on what buyers near you want.
      </p>
    </section>
  );
}

export default function SellWithUs() {
  const { money, categories } = useMeta();
  const r = useRules();

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-pepper">For food businesses in Lagos</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">Unsold food is lost money. Sell it instead.</h1>
        <p className="mt-3 text-lg text-mute">Bakeries, restaurants, supermarkets, hotels and food vendors use GbaanJo to sell what is left at the end of the day, at least {r.minDiscount}% off, to people nearby.</p>
        <Button as={Link} to={APPLY} size="lg" className="mt-6">Apply as a seller</Button>
      </header>

      <section aria-labelledby="get-title">
        <h2 id="get-title" className="text-2xl font-extrabold">What you get</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['💰', 'Recover revenue', 'Earn from food that would otherwise be thrown away.'],
            ['🛍️', 'Reach new customers', 'People nearby discover your business through a good deal.'],
            ['🆓', 'No set-up cost', 'Listing is free. You only pay a fee when you sell.'],
          ].map(([e, t, d]) => (
            <li key={t} className="rounded-2xl bg-white p-5 ring-[1.5px] ring-line">
              <span aria-hidden="true" className="text-3xl">{e}</span>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="text-mute">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <Calculator r={r} money={money} />

      <section aria-labelledby="join-title" className={box}>
        <h2 id="join-title" className="text-2xl font-extrabold">Join in 4 steps</h2>
        <Steps
          className="mt-6"
          steps={[
            ['Apply', 'Create a seller account with your business name and CAC number, and verify your email.'],
            ['Get approved', 'We check your registration and email you when you are approved.'],
            ['Add your payout account', 'Tell us which bank account your earnings should go to.'],
            ['List your first deal', `Add a photo, the price (at least ${r.minDiscount}% off), how many and when the sale ends.`],
          ]}
        />
      </section>

      <section aria-labelledby="fees-title" className={box}>
        <h2 id="fees-title" className="text-2xl font-extrabold">Clear fees</h2>
        <dl className="mt-4 grid gap-3">
          {[
            ['Joining and listing', 'Free'],
            ['GbaanJo fee, per order', `${r.feePercent}% (at least ${money(r.minFee)})`],
            ['Buyer service fee', r.buyerFee > 0 ? `${money(r.buyerFee)} per order, paid by the buyer, not you` : 'None'],
          ].map(([t, d]) => (
            <div key={t} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
              <dt className="text-mute">{t}</dt>
              <dd className="font-bold">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="need-title">
        <h2 id="need-title" className="text-2xl font-extrabold">What you need</h2>
        <ul className="mt-4 grid gap-2">
          {['Your CAC registration number (RC or BN)', 'A bank account for your earnings', 'A phone number buyers can reach you on', 'An email address'].map((t) => (
            <li key={t} className="flex gap-3 rounded-xl bg-white p-4 ring-[1.5px] ring-line">
              <span aria-hidden="true" className="text-leaf">✓</span>{t}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sfaq-title">
        <h2 id="sfaq-title" className="text-2xl font-extrabold">Questions</h2>
        <Faq items={sellerFaq(r, money, categories)} className="mt-4" />
      </section>

      <div className="rounded-3xl bg-leaf p-6 text-white sm:p-8">
        <h2 className="text-2xl font-extrabold">Ready to stop throwing food away?</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button as={Link} to={APPLY} variant="palm" size="lg">Apply as a seller</Button>
          <Button as={Link} to="/how-it-works?for=sellers" variant="ghost" size="lg">How selling works</Button>
        </div>
      </div>
    </div>
  );
}
