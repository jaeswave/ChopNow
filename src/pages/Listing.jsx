import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Art, Countdown, StatusBadge, Verified, naira, pctOff, when } from '../components';
import { Button, Spinner, useToast } from '../ui';

export default function Listing() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [l, setL] = useState(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/listings/' + id).then(setL).catch((e) => setErr(e.message)); }, [id]);
  const [fee, setFee] = useState(0);
  useEffect(() => { api('/listings/meta').then((m) => setFee(m.rules.BUYER_SERVICE_FEE || 0)).catch(() => {}); }, []);

  if (!l) return err
    ? <div className="py-20 text-center"><p className="text-xl font-bold text-pepper">{err}</p><Button as={Link} to="/" className="mt-4">Back to live deals</Button></div>
    : <div className="grid animate-pulse gap-4"><div className="h-72 rounded-3xl bg-line/70" /><div className="h-10 w-2/3 rounded bg-line/70" /><div className="h-6 w-1/2 rounded bg-line/70" /></div>;

  const live = l.status === 'ACTIVE' && l.quantityLeft > 0 && new Date(l.saleEndsAt) > new Date();
  const max = Math.min(5, l.quantityLeft);
  const reserve = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api('/orders', { method: 'POST', body: { listingId: id, quantity: qty } });
      if (r.authorizationUrl) { window.location.href = r.authorizationUrl; return; }
      toast('Reserved! Your pickup code is in My orders.');
      nav('/orders');
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div>
      <Link to="/#deals" className="text-sm font-semibold text-mute hover:text-ink">← Back to live deals</Link>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <article className="grid gap-5">
          <div className="relative"><Art c={l.category} src={l.imageUrl} size="xl" /><div className="absolute left-4 top-4"><Countdown to={l.saleEndsAt} /></div></div>
          <div>
            <div className="flex flex-wrap items-center gap-3"><StatusBadge s={l.status} listing /><span className="text-sm text-mute">{l.category}</span></div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">{l.title}</h1>
            <p className="mt-2 text-mute">Sold by <b className="text-ink">{l.seller.businessName}</b><Verified v={l.seller.verified} /> · {l.area}, {l.city}</p>
          </div>
          {l.description && <p className="text-lg">{l.description}</p>}

          <div className="rounded-2xl bg-white p-6 ring-[1.5px] ring-line">
            <h2 className="text-xl font-bold">How pickup works</h2>
            <ol className="mt-4 grid gap-4">
              {[['Reserve and pay', 'Pay securely online with Paystack. Your portion is held for a few minutes while you pay.'], ['Get your code', 'You get a 6-digit code, the exact address and the seller\'s phone number.'], ['Collect by ' + when(l.pickupBy), 'Show your code to the seller. It is already paid for.']].map(([t, d], i) => (
                <li key={t} className="flex gap-3"><span className="grid size-8 flex-none place-items-center rounded-full bg-leaf text-sm font-extrabold text-palm">{i + 1}</span><div><b>{t}</b><p className="text-sm text-mute">{d}</p></div></li>
              ))}
            </ol>
          </div>
          <p className="rounded-2xl bg-palm/25 p-4 text-sm"><b>Food safety:</b> check the food before paying and skip anything that looks or smells wrong. The seller is responsible for the food they list.</p>
        </article>

        <aside className="rounded-3xl bg-white p-6 shadow-xl shadow-leaf/10 ring-[1.5px] ring-line lg:sticky lg:top-24">
          <div className="flex items-baseline gap-3">
            <strong className="font-display text-5xl">{naira(l.price)}</strong>
            <s className="text-lg text-mute">{naira(l.originalPrice)}</s>
          </div>
          <p className="mt-1 font-bold text-pepper">{pctOff(l.originalPrice, l.price)}% off · you save {naira((l.originalPrice - l.price) * qty)}</p>
          <p className="mt-1 text-sm text-mute">{l.quantityLeft} of {l.quantity} left</p>

          <div className="mt-5 grid gap-3 border-t border-line pt-5">
            {err && <p className="font-medium text-pepper">{err}</p>}
            {!live ? <p className="rounded-xl bg-paper p-4 text-center font-semibold text-mute">This listing has ended or sold out.</p>
              : !user ? <Button size="lg" onClick={() => nav('/auth')}>Log in to reserve</Button>
              : user.role !== 'BUYER' ? <p className="rounded-xl bg-paper p-4 text-sm text-mute">Seller accounts can't reserve. Use a buyer account.</p>
              : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button aria-label="Fewer" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="size-10 cursor-pointer rounded-full text-xl ring-[1.5px] ring-line hover:ring-leaf disabled:opacity-40">−</button>
                      <span className="w-6 text-center text-lg font-bold">{qty}</span>
                      <button aria-label="More" disabled={qty >= max} onClick={() => setQty(qty + 1)} className="size-10 cursor-pointer rounded-full text-xl ring-[1.5px] ring-line hover:ring-leaf disabled:opacity-40">+</button>
                    </div>
                  </div>
                  <div className="grid gap-1 text-sm text-mute">
                    <div className="flex justify-between"><span>Food</span><span>{naira(l.price * qty)}</span></div>
                    {fee > 0 && <div className="flex justify-between"><span>Service fee</span><span>{naira(fee)}</span></div>}
                  </div>
                  <div className="flex justify-between text-lg"><span>Total to pay</span><b>{naira(l.price * qty + fee)}</b></div>
                  <Button size="lg" disabled={busy} onClick={reserve}>{busy ? <Spinner /> : 'Pay and reserve'}</Button>
                </>
              )}
            <ul className="mt-1 grid gap-1.5 text-sm text-mute">
              <li>✓ Secure payment by Paystack</li><li>✓ Cancel for a refund before the sale ends</li><li>✓ Up to 5 per reservation</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
