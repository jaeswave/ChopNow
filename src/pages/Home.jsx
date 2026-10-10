import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Art, ART, Card, CardSkeleton, Tag, naira } from '../components';
import { Button, Chip, Container, Input, Reveal, Select, cx } from '../ui';

const FOODS = ['🍛 Jollof rice', '🍞 Fresh bread', '🥧 Meat pie', '🍅 Tomatoes and pepper', '🐟 Fresh fish', '🥛 Fura da nono', '🍢 Suya and small chops'];
const FACTS = [['30%+', 'off on every single deal'], ['Paystack', 'secure card, transfer and USSD payments'], ['8', 'food categories'], ['12', 'Nigerian cities']];

const BUYER_STEPS = [
  ['Find a deal', 'Choose your city and see what is live, sorted by what ends soonest.'],
  ['Pay online first', 'Choose how many (up to 5) and pay securely with Paystack. Your food is held while you pay.'],
  ['Get your order number and code', 'You get an order number, a 6-digit pickup code, and the exact address.'],
  ['Collect it, or send a friend', 'Show the code to the seller. Anyone with your code can collect for you.'],
];
const SELLER_STEPS = [
  ['Apply with your CAC number', 'Sign up, verify your email and give us your RC or BN number so we can check your business.'],
  ['Get approved', 'Once we confirm your registration, you can add your payout account and upload food photos.'],
  ['List your surplus', 'Add the food, the price, how many, and when the sale ends. GbaanJo takes a 10% fee only when you sell.'],
  ['Hand over with a code', 'The customer shows a 6-digit code. Type it in, check the order, and confirm.'],
];
const CATS = [
  ['Cooked meals', 'Jollof, fried rice, egusi, pounded yam, rice and stew'], ['Bakery', 'Bread, meat pie, doughnuts, cakes'],
  ['Fresh produce', 'Tomatoes, pepper, ugu, plantain, vegetables'], ['Meat & fish', 'Fresh fish, chicken, goat meat'],
  ['Dairy & drinks', 'Yoghurt, fura da nono, zobo, milk'], ['Frozen foods', 'Frozen chicken, turkey, fish'],
  ['Snacks & small chops', 'Suya, puff puff, chin chin, samosa'], ['Groceries', 'Rice, noodles, tinned and packaged items'],
];
const RULES = [
  ['At least 30% off', 'Every listing must be a real discount, so buyers always get a proper deal.'],
  ['Strict time limits', 'The server enforces every sale end time. Nothing can be reserved after it.'],
  ['No overselling', 'If two people tap for the last pack at the same moment, only one gets it.'],
  ['Pickup codes', 'A handover is only confirmed with the buyer\'s code, so orders cannot be faked.'],
  ['No-show protection', 'Reservations not collected in time are tracked. After 3 no-shows, reserving is paused.'],
  ['Private addresses', 'Exact addresses are only shared with buyers who have reserved.'],
];
const FAQ = [
  ['How do I pay?', 'Securely online with Paystack when you reserve, using your card, bank transfer or USSD. Your food is held for a few minutes while you pay.'],
  ['What if I cannot make it?', 'Cancel from My orders before the sale ends and you get a refund while the food goes back for someone else. Once the sale has ended the order stays with the seller, so please make it.'],
  ['What can be sold here?', 'Cooked meals, bakery items, fresh produce, meat and fish, dairy and drinks, frozen foods, small chops and groceries close to the end of their selling window.'],
  ['Is the food safe?', 'Sellers are responsible for what they list and should be honest about when it was made and how it was stored. Buyers should check food before paying and skip anything that looks or smells wrong.'],
  ['How long can a listing run?', 'From 15 minutes up to 72 hours. Buyers then have up to 24 hours after the sale ends to collect.'],
  ['What if the seller cancels?', 'Your order is cancelled and you are refunded. You will see it in My orders.'],
  ['How much does it cost to sell?', 'Listing is free. GbaanJo takes a 10% fee on each sale, and Paystack sends the rest straight to your bank account.'],
  ['How do I start selling?', 'Create a seller account with your business name and CAC number (RC or BN), and verify your email. After we approve your application you can add payout details, upload photos and publish your first listing.'],
  ['Why do sellers need a CAC number?', 'It lets us confirm that every seller is a registered business before they sell food to the public. This keeps buyers safe and builds trust.'],
  ['Can someone else collect my order?', 'Yes. After you pay, you get a pickup code. Send it to anyone you trust and they can collect the food by showing it. Only share it with people you trust, because whoever shows the code gets the food.'],
];

const Section = ({ id, className = '', children }) => (
  <section id={id} className={cx('flex min-h-screen scroll-mt-16 items-center py-20 sm:py-24', className)}>
    <Container>{children}</Container>
  </section>
);
const Heading = ({ title, sub, light, className = '' }) => (
  <div className={className}>
    <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl">{title}</h2>
    {sub && <p className={cx('mt-3 max-w-xl text-lg', light ? 'text-white/80' : 'text-mute')}>{sub}</p>}
  </div>
);

function MockCard({ cat, size, tone, time, title, sub, price, was, off, className }) {
  return (
    <div className={cx('rounded-2xl bg-white p-3 text-ink shadow-2xl shadow-black/30', className)}>
      <div className="relative"><Art c={cat} size={size} /><div className="absolute left-3 top-3"><Tag tone={tone}>{time}</Tag></div></div>
      <h3 className="mt-3 text-lg font-semibold leading-tight">{title}</h3>
      {sub && <p className="text-sm text-mute">{sub}</p>}
      <div className="mt-1.5 flex items-baseline gap-2"><strong className="font-display text-3xl">{price}</strong><s className="text-mute">{was}</s>{off && <em className="font-bold not-italic text-pepper">{off}</em>}</div>
    </div>
  );
}

export default function Home() {
  const [meta, setMeta] = useState({ categories: [], cities: [] });
  const [f, setF] = useState({ city: '', category: '', q: '' });
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('buyers');
  const [heroCity, setHeroCity] = useState('');
  const [meals, setMeals] = useState(12);

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const load = () => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    setErr('');
    return api('/listings?' + qs).then(setItems).catch((e) => { setErr(e.message); setItems([]); });
  };

  useEffect(() => { api('/listings/meta').then(setMeta).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [f]);

  const steps = tab === 'buyers' ? BUYER_STEPS : SELLER_STEPS;
  const filtered = f.city || f.category || f.q;
  const saved = Math.round(meals * 3500 * 0.45);

  return (
    <>
      {/* 1. HERO */}
      <Section className="overflow-hidden bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-palm">Made for Nigerian kitchens, bakeries and markets</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">Rescue good food. Pay less. Waste less.</h1>
            <p className="mt-6 max-w-xl text-lg text-white/85 sm:text-xl">Kitchens, bakeries, markets and shops list what they cannot sell today. You pay online, get a pickup code, and collect it. Every deal is at least 30% off.</p>

            <form onSubmit={(e) => { e.preventDefault(); setF({ ...f, city: heroCity }); go('deals'); }} className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 sm:flex-row">
              <select aria-label="Your city" value={heroCity} onChange={(e) => setHeroCity(e.target.value)} className="min-h-12 flex-1 cursor-pointer rounded-xl bg-transparent px-4 text-ink outline-none">
                <option value="">All cities</option>
                {meta.cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <Button size="lg" className="sm:!px-6">Find deals near me</Button>
            </form>
            <p className="mt-4 text-sm text-white/70">Want to sell instead? <Link to="/auth" className="font-bold text-palm underline underline-offset-4">Start a seller account</Link></p>
          </div>

          <div className="relative mx-auto hidden h-[470px] w-full max-w-md sm:block" aria-hidden="true">
            <MockCard className="absolute right-0 top-0 w-80 rotate-3 animate-float" cat="Cooked meals" size="lg" tone="hot" time="1h 12m left" title="Party jollof and chicken, 10 packs" sub="Example listing · Lekki Phase 1" price="₦2,500" was="₦6,000" off="58% off" />
            <MockCard className="absolute bottom-0 left-0 w-60 -rotate-6 animate-float [animation-delay:-3s]" cat="Bakery" size="md" tone="palm" time="3h 05m left" title="Fresh bread, 12 loaves" price="₦700" was="₦1,500" />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 md:grid-cols-4">
          {FACTS.map(([n, t]) => <div key={t}><div className="font-display text-4xl font-extrabold text-palm">{n}</div><p className="text-sm text-white/75">{t}</p></div>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">{FOODS.map((t) => <span key={t} className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90">{t}</span>)}</div>
      </Section>

      {/* 2. WHY */}
      <Section id="why">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">Good food should end up on a plate, not in the bin.</h2>
            <p className="mt-5 max-w-lg text-lg text-mute">Every day, kitchens cook a little too much, bakeries bake more than they sell, and market stalls close with produce that will not last till morning. Most of it is thrown away, even though someone nearby would happily buy it for less.</p>
            <ul className="mt-8 grid gap-4">
              {[['🛍️', 'Buyers eat well for less', 'Meals, bread, produce and groceries at least 30% off, close to you.'], ['💰', 'Sellers recover their money', 'Turn tonight\'s leftovers into cash and meet new customers.'], ['🌍', 'Less food goes to waste', 'More of what gets cooked and grown ends up being eaten.']].map(([e, t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-12 flex-none place-items-center rounded-xl bg-palm/30 text-2xl">{e}</span>
                  <div><h3 className="text-lg font-semibold">{t}</h3><p className="text-mute">{d}</p></div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-leaf/10 ring-[1.5px] ring-line sm:p-8">
              <h3 className="text-2xl font-bold">How much could you save?</h3>
              <p className="mt-1 text-mute">Slide to see an estimate.</p>
              <label className="mt-6 block font-semibold">Meals or food buys per month: <span className="text-pepper">{meals}</span>
                <input type="range" min="4" max="40" step="2" value={meals} onChange={(e) => setMeals(+e.target.value)} className="mt-3 w-full cursor-pointer accent-leaf" />
              </label>
              <div className="mt-6 rounded-2xl bg-leaf p-6 text-white">
                <p className="text-white/80">You could save about</p>
                <p className="font-display text-5xl font-extrabold text-palm">{naira(saved)}</p>
                <p className="mt-1 text-sm text-white/70">a month</p>
              </div>
              <p className="mt-4 text-xs text-mute">Estimate only. Assumes a ₦3,500 meal bought at about 45% off. Real savings depend on what is listed near you.</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* MISSION */}
      <Section id="mission" className="bg-leaf text-white">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">Good food deserves to be eaten, not thrown away.</h2>
            <p className="mt-5 max-w-lg text-lg text-white/85">GbaanJo is a Nigerian marketplace on a mission to make wasting good food a thing of the past. Every day, kitchens, bakeries, supermarkets and market traders are left with food that is perfectly fine but will not sell in time.</p>
            <p className="mt-4 max-w-lg text-lg text-white/85">We connect them with people nearby who are happy to buy it at a fair price. The food gets eaten, the business recovers its money, and you eat well for less. Every order is a small win against waste.</p>
            <Button variant="palm" size="lg" className="mt-8" onClick={() => go('deals')}>Join the movement</Button>
          </Reveal>
          <Reveal delay={150}>
            <div className="grid gap-4">
              {[['🍽️', 'Food gets eaten', 'Good meals and groceries go to people, not the bin.'], ['💚', 'Businesses recover costs', 'Sellers turn tonight\'s surplus into money.'], ['🤝', 'Communities benefit', 'Neighbours get quality food at a price that works.']].map(([e, t, d]) => (
                <div key={t} className="flex gap-4 rounded-2xl bg-white/10 p-5">
                  <span className="grid size-12 flex-none place-items-center rounded-xl bg-palm text-2xl">{e}</span>
                  <div><h3 className="text-xl font-semibold">{t}</h3><p className="text-white/80">{d}</p></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 3. HOW IT WORKS */}
      <Section id="how" className="bg-white">
        <Reveal className="text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl">How GbaanJo works</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-mute">Four simple steps, whether you are hungry or have food to move.</p>
          <div className="mt-6 inline-flex gap-2 rounded-full bg-paper p-1.5">
            {[['buyers', 'I want to buy'], ['sellers', 'I want to sell']].map(([k, t]) => <Chip key={k} on={tab === k} onClick={() => setTab(k)} className="!ring-0">{t}</Chip>)}
          </div>
        </Reveal>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <ol key={tab} className="grid gap-8">
            {steps.map(([t, d], i) => (
              <li key={t} className="relative pl-16 before:absolute before:left-6 before:top-14 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-line last:before:hidden">
                <span className="absolute left-0 top-0 grid size-12 place-items-center rounded-full bg-leaf font-display text-xl font-extrabold text-palm">{i + 1}</span>
                <h3 className="text-xl font-semibold">{t}</h3><p className="mt-1 text-mute">{d}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-paper p-5 ring-[1.5px] ring-line" aria-hidden="true">
            {tab === 'buyers' ? (
              <div className="grid gap-3">
                <p className="text-sm text-mute">Example reservation</p>
                <b>2 × Party jollof and chicken</b>
                <p className="text-sm text-mute">Mama Tee Kitchen · ₦5,000 paid</p>
                <div className="rounded-xl bg-leaf p-4 text-white"><span className="text-sm">Show this code to the seller</span><div className="font-display text-4xl font-extrabold tracking-[.2em] text-palm">482917</div></div>
                <p className="text-sm">Collect by <b>Sat 8:30 pm</b>. The exact address shows after you reserve.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm text-mute">Example reservation on your dashboard</p>
                <b>2 × Party jollof and chicken</b>
                <p className="text-sm text-mute">Chioma A. · ₦5,000 · collect by Sat 8:30 pm</p>
                <div className="flex gap-2"><div className="flex-1 rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-mute">6-digit code</div><span className="grid place-items-center rounded-xl bg-pepper px-4 text-sm font-bold text-white">Confirm</span></div>
                <p className="text-sm text-mute">Match the buyer's code to hand over safely.</p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* 4. LIVE DEALS */}
      <Section id="deals">
        <div className="w-full">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Heading title="Live now" sub="Real listings from real sellers. Ending soonest first." />
            {items && <p className="font-semibold text-mute">{items.length} deal{items.length === 1 ? '' : 's'} live{filtered ? ' with these filters' : ''}</p>}
          </div>

          <div className="sticky top-16 z-20 -mx-5 mt-6 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
            <div className="flex flex-wrap gap-3">
              <Select className="sm:w-48" aria-label="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                <option value="">All cities</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Input className="min-w-56 flex-1" aria-label="Search" placeholder="Search jollof, bread, tomatoes, fish…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
              {filtered && <Button variant="outline" onClick={() => setF({ city: '', category: '', q: '' })}>Clear</Button>}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {['', ...meta.categories].map((c) => <Chip key={c} on={f.category === c} onClick={() => setF({ ...f, category: c })} className="shrink-0">{ART[c] ? ART[c][0] + ' ' : ''}{c || 'Everything'}</Chip>)}
            </div>
          </div>

          {err && (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-[1.5px] ring-pepper/40">
              <p className="text-lg font-bold text-pepper">{err}</p>
              <p className="mt-1 text-mute">If you are running this locally, make sure the backend is started.</p>
              <Button className="mt-4" onClick={load}>Try again</Button>
            </div>
          )}
          {!err && items && items.length === 0 && (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-[1.5px] ring-line">
              <div className="text-6xl">🍽️</div>
              <p className="mt-3 text-xl font-bold">Nothing live here right now</p>
              <p className="mx-auto mt-1 max-w-md text-mute">Try another city or category. Most sellers list in the afternoon and evening, so check back later.</p>
              <Button as={Link} to="/auth" className="mt-5">Are you a seller? List something</Button>
            </div>
          )}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {!items && Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            {items?.map((l) => <Card key={l.id} l={l} />)}
          </div>
        </div>
      </Section>

      {/* 5. WHAT YOU CAN FIND */}
      <Section className="bg-white">
        <Heading title="What you can find" sub="From a hot plate of jollof to a bag of tomatoes. Tap a category to see what is live." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map(([c, ex], i) => (
            <Reveal key={c} delay={(i % 4) * 80}>
              <button onClick={() => { setF({ ...f, category: c }); go('deals'); }} className="group h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-paper text-left ring-[1.5px] ring-line transition hover:-translate-y-1 hover:ring-leaf">
                <Art c={c} className="transition duration-300 group-hover:scale-105" />
                <div className="p-4"><h3 className="font-semibold">{c}</h3><p className="mt-1 text-sm text-mute">{ex}</p></div>
              </button>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 6. FOR SELLERS */}
      <Section id="sell" className="bg-palm text-[#2a1d00]">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">Cooking too much? Stock not moving?</h2>
            <p className="mt-5 max-w-lg text-lg">Turn tonight's surplus into money instead of waste. Listing is free and takes about two minutes. GbaanJo only takes a 10% fee when you make a sale, and Paystack sends the rest to your bank account.</p>
            <ul className="mt-6 grid gap-2 font-semibold sm:grid-cols-2">
              {['Restaurants and mama put', 'Bakeries and pastry shops', 'Caterers after events', 'Supermarkets and mini-marts', 'Fish, meat and produce sellers', 'Market traders'].map((w) => <li key={w} className="rounded-lg bg-white/55 px-4 py-2.5">{w}</li>)}
            </ul>
            <Button as={Link} to="/auth" variant="leaf" size="lg" className="mt-8">Start selling</Button>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-3xl bg-white p-6 text-ink shadow-xl sm:p-8">
              <p className="text-sm font-medium text-mute">Example only: one evening's surplus</p>
              <div className="mt-4 grid gap-3">
                {[['Party jollof packs left over', '10 packs'], ['Normal price', '₦6,000 each'], ['Your last-call price', '₦2,500 each'], ['Packs sold', '8 packs'], ['GbaanJo fee (10%)', '− ₦2,000']].map(([a, b]) => <div key={a} className="flex justify-between border-b border-line pb-3"><span className="text-mute">{a}</span><b>{b}</b></div>)}
              </div>
              <p className="mt-5 text-sm text-mute">Paid to your bank account after the fee</p>
              <p className="font-display text-5xl font-extrabold text-leaf">₦18,000</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 7. TRUST */}
      <Section id="trust" className="bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
        <Heading light title="Rules that keep it fair" sub="Built in from day one, so buyers and sellers can both trust the app." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <div className="h-full rounded-2xl border-l-4 border-palm bg-white/10 p-6"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-2 text-white/80">{d}</p></div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-palm p-6 text-[#2a1d00]"><b>Food safety comes first.</b> Sellers must be honest about when food was made and how it was stored. Buyers should check everything before paying, and skip anything that looks or smells wrong.</div>
      </Section>

      {/* 8. FAQ + FINAL CTA */}
      <Section id="faq">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <Heading title="Questions" sub="Quick answers before you start." />
            <div className="mt-8 grid gap-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group rounded-xl bg-white p-4 ring-[1.5px] ring-line transition open:ring-leaf">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">{q}<span className="text-leaf transition group-open:rotate-180">▾</span></summary>
                  <p className="mt-2 text-mute">{a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="self-center rounded-3xl bg-leaf p-8 text-white shadow-xl shadow-leaf/20">
            <h2 className="text-3xl font-extrabold">Ready to chop for less?</h2>
            <p className="mt-3 text-white/80">Join as a buyer to grab deals near you, or as a seller to turn surplus into cash.</p>
            <div className="mt-6 grid gap-3">
              <Button variant="palm" size="lg" onClick={() => go('deals')}>See live deals</Button>
              <Button as={Link} to="/auth" variant="ghost" size="lg">Create a free account</Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
