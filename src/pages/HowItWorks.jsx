import { Link, useSearchParams } from 'react-router-dom';
import Faq from '../components/Faq';
import Steps from '../components/Steps';
import { sellerFaq } from './sellerFaq';
import { useMeta, useRules } from '../hooks/useMeta';
import { Button, Chip } from '../ui';

// Every number here comes from the server's rules (GET /listings/meta), with fallbacks in config/market.js.
function buyerContent(r, money) {
  const fee = r.buyerFee > 0 ? ` A ${money(r.buyerFee)} service fee is added to each order.` : '';
  return {
    steps: [
      ['Find a deal', `Open Live deals and pick something near you. Every deal is at least ${r.minDiscount}% off, and the ones ending soonest are easy to spot.`],
      ['Reserve and pay', `Choose how many (up to ${r.maxPerOrder}) and pay securely online with OPay. We hold the food for ${r.holdMinutes} minutes while you pay.${fee}`],
      ['Get your 6-digit code', 'You get an order number, a 6-digit pickup code and the exact address.'],
      ['Collect', 'Go before the pickup deadline, show your code to the seller and check the food before you leave.'],
    ],
    notes: [
      ['Cannot collect yourself?', 'Send your code to someone you trust. Whoever shows the code collects the food, so only share it with people you trust.'],
      ['While you pay', `The food is held for ${r.holdMinutes} minutes. If payment is not finished in that time, it goes back on sale for someone else.`],
      ['Refunds', `Cancel from My orders while the sale is still open and you get a full refund. If the seller cancels or we remove a listing, you are refunded in full. If you do not collect before the pickup deadline, the order counts as a no-show and is not refunded. Refunds go back to your original payment method within 1 to 3 working days.`],
    ],
    faq: [
      ['What does it cost?', `You pay the deal price shown on the listing${r.buyerFee > 0 ? `, plus a ${money(r.buyerFee)} service fee per order` : ''}. You see the total before you pay.`],
      ['How long do I have to collect?', `Each order shows its pickup deadline. It can be up to ${r.maxPickupHours} hours after the sale ends.`],
      ['Is the food safe?', 'Sellers are responsible for what they list and must be honest about when it was made and how it was stored. Check the food before you leave, and skip anything that looks or smells wrong.'],
      ['What if the seller cancels?', 'Your order is cancelled and you are refunded in full. You will see it in My orders.'],
      ['What happens if I miss a pickup?', `The order is not refunded. After ${r.maxNoShows} missed pickups, reserving is paused on your account.`],
      ['Do I need an account?', 'Yes. Create a free account and verify your email before you order, so sellers know every order is real.'],
    ],
  };
}

function sellerContent(r, money, categories) {
  return {
    steps: [
      ['Apply with your CAC number', 'Create a seller account, verify your email and give us your RC or BN number so we can check your business.'],
      ['Get approved', 'We check your registration and email you as soon as you are approved.'],
      ['Add your payout account', 'Tell us which bank account to pay. Your earnings go there.'],
      ['List your surplus', `Add a photo, the price (at least ${r.minDiscount}% off), how many, and when the sale ends: from ${r.minSaleMinutes} minutes up to ${r.maxSaleHours} hours.`],
      ['Hand over with the code', 'The buyer shows a 6-digit code. Type it in, check the order and confirm.'],
      ['Get paid', `After the handover we pay your share to your bank account. GbaanJo keeps ${r.feePercent}% of each order (at least ${money(r.minFee)}).`],
    ],
    notes: [],
    faq: sellerFaq(r, money, categories),
  };
}

const PATHS = [['buyers', 'I want to buy'], ['sellers', 'I sell food']];

export default function HowItWorks() {
  const [params, setParams] = useSearchParams();
  const path = params.get('for') === 'sellers' ? 'sellers' : 'buyers';
  const { money, categories } = useMeta();
  const r = useRules();
  const c = path === 'buyers' ? buyerContent(r, money) : sellerContent(r, money, categories);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">How GbaanJo works</h1>
      <p className="mt-3 text-lg text-mute">Good food from Lagos kitchens, bakeries and shops, at least {r.minDiscount}% off. Here is how it works for you.</p>

      <div className="mt-6 inline-flex flex-wrap gap-2 rounded-full bg-white p-1.5 ring-[1.5px] ring-line" role="group" aria-label="Show steps for">
        {PATHS.map(([k, t]) => (
          <Chip key={k} on={path === k} aria-pressed={path === k} className="!ring-0" onClick={() => setParams(k === 'buyers' ? {} : { for: k }, { replace: true })}>
            {t}
          </Chip>
        ))}
      </div>

      <section aria-labelledby="steps-title" className="mt-8 rounded-2xl bg-white p-5 ring-[1.5px] ring-line sm:p-8">
        <h2 id="steps-title" className="text-2xl font-extrabold">{path === 'buyers' ? 'Buying, step by step' : 'Selling, step by step'}</h2>
        <Steps steps={c.steps} className="mt-6" />
      </section>

      {c.notes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {c.notes.map(([t, d]) => (
            <section key={t} className="rounded-2xl bg-leaf/5 p-5 ring-[1.5px] ring-leaf/20">
              <h2 className="text-lg font-extrabold">{t}</h2>
              <p className="mt-1 text-mute">{d}</p>
            </section>
          ))}
        </div>
      )}

      <section aria-labelledby="faq-title" className="mt-10">
        <h2 id="faq-title" className="text-2xl font-extrabold">Questions</h2>
        <Faq items={c.faq} className="mt-4" />
      </section>

      <div className="mt-10 rounded-3xl bg-leaf p-6 text-white sm:p-8">
        {path === 'buyers' ? (
          <>
            <h2 className="text-2xl font-extrabold">Hungry? See what is on now.</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button as={Link} to="/deals" variant="palm" size="lg">See live deals</Button>
              <Button as={Link} to="/auth?mode=register" variant="ghost" size="lg">Create a free account</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold">Turn tonight's surplus into money.</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button as={Link} to="/auth?mode=register&role=SELLER" variant="palm" size="lg">Apply as a seller</Button>
              <Button as={Link} to="/sell-with-us" variant="ghost" size="lg">Why sell with GbaanJo</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
