import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Art, Countdown, StatusBadge, naira, when } from '../components';
import { Button, Chip, Field, Input, Select, Spinner, Textarea, cx, useToast } from '../ui';

const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const inHours = (h) => local(new Date(Date.now() + h * 36e5));
const blank = { title: '', description: '', category: '', city: '', area: '', address: '', originalPrice: '', price: '', quantity: '', saleEndsAt: inHours(3), pickupBy: inHours(5) };
const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line';

const Stat = ({ label, value, tone = '' }) => (
  <div className={cx(box, 'p-4')}><p className="text-sm text-mute">{label}</p><p className={cx('font-display text-3xl font-extrabold', tone)}>{value}</p></div>
);

function OrderRow({ o, reload }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmPickup = async () => {
    setBusy(true);
    try { await api(`/orders/${o.id}/complete`, { method: 'POST', body: { code } }); toast('Pickup confirmed. Nice one!'); reload(); }
    catch (e) { toast(e.message, 'err'); setBusy(false); }
  };
  return (
    <li className={cx(box, 'flex flex-wrap items-center justify-between gap-4')}>
      <div>
        <div className="flex flex-wrap items-center gap-2"><b>{o.quantity} × {o.listing.title}</b><StatusBadge s={o.status} /></div>
        <p className="text-sm text-mute">{o.buyer.name} · {naira(o.totalPrice)} · collect by {when(o.listing.pickupBy)}</p>
      </div>
      {o.status === 'RESERVED' && (
        <div className="flex gap-2">
          <Input className="w-36 tracking-widest" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Button size="sm" disabled={busy || code.length !== 6} onClick={confirmPickup}>{busy ? <Spinner /> : 'Confirm pickup'}</Button>
        </div>
      )}
    </li>
  );
}

export default function Seller() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState({ categories: [], cities: [] });
  const [mine, setMine] = useState(null);
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('orders');
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const reload = () => Promise.all([api('/listings/mine/all').then(setMine), api('/orders/seller').then(setOrders)]).catch((e) => toast(e.message, 'err'));
  useEffect(() => {
    if (!user) return nav('/auth');
    if (user.role !== 'SELLER') return nav('/');
    api('/listings/meta').then(setMeta).catch(() => {}); reload();
  }, [user]);

  const preset = (h) => { const end = Date.now() + h * 36e5; setF({ ...f, saleEndsAt: local(new Date(end)), pickupBy: local(new Date(end + 2 * 36e5)) }); };
  const disc = f.originalPrice && f.price ? Math.round((1 - f.price / f.originalPrice) * 100) : null;

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/listings', { method: 'POST', body: {
        ...f, originalPrice: Number(f.originalPrice), price: Number(f.price), quantity: Number(f.quantity),
        saleEndsAt: new Date(f.saleEndsAt).toISOString(), pickupBy: new Date(f.pickupBy).toISOString(),
      } });
      toast('Your listing is live!');
      setF({ ...blank, category: f.category, city: f.city, area: f.area, address: f.address, saleEndsAt: inHours(3), pickupBy: inHours(5) });
      await reload(); setTab('listings');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this listing? Open reservations will be cancelled too.')) return;
    try { await api(`/listings/${id}/cancel`, { method: 'PATCH' }); toast('Listing cancelled.'); reload(); } catch (e) { toast(e.message, 'err'); }
  };

  const awaiting = orders?.filter((o) => o.status === 'RESERVED') || [];
  const done = orders?.filter((o) => o.status === 'PICKED_UP') || [];
  const earned = done.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div>
      <h1 className="text-4xl font-extrabold">{user?.businessName}</h1>
      <p className="mt-1 text-mute">Manage your listings and confirm pickups.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Live listings" value={mine ? mine.filter((l) => l.status === 'ACTIVE').length : '–'} />
        <Stat label="Awaiting pickup" value={orders ? awaiting.length : '–'} tone={awaiting.length ? 'text-pepper' : ''} />
        <Stat label="Picked up" value={orders ? done.length : '–'} />
        <Stat label="Collected so far" value={orders ? naira(earned) : '–'} tone="text-leaf" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Chip on={tab === 'orders'} onClick={() => setTab('orders')}>Reservations ({awaiting.length})</Chip>
        <Chip on={tab === 'listings'} onClick={() => setTab('listings')}>My listings</Chip>
        <Chip on={tab === 'new'} onClick={() => setTab('new')}>+ New listing</Chip>
      </div>

      {tab === 'orders' && (
        <div className="mt-5">
          {orders && orders.length === 0 && <div className={cx(box, 'p-10 text-center')}><div className="text-5xl">📦</div><p className="mt-3 text-xl font-bold">No reservations yet</p><p className="mt-1 text-mute">When buyers reserve your food, it shows up here.</p><Button className="mt-4" onClick={() => setTab('new')}>Create a listing</Button></div>}
          <ul className="grid gap-3">{orders?.map((o) => <OrderRow key={o.id} o={o} reload={reload} />)}</ul>
        </div>
      )}

      {tab === 'listings' && (
        <div className="mt-5">
          {mine && mine.length === 0 && <div className={cx(box, 'p-10 text-center')}><div className="text-5xl">🍳</div><p className="mt-3 text-xl font-bold">You haven't listed anything yet</p><Button className="mt-4" onClick={() => setTab('new')}>List your first item</Button></div>}
          <ul className="grid gap-3">
            {mine?.map((l) => (
              <li key={l.id} className={cx(box, 'flex flex-wrap items-center gap-4')}>
                <Art c={l.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><b>{l.title}</b><StatusBadge s={l.status} listing /></div>
                  <p className="text-sm text-mute">{naira(l.price)} (was {naira(l.originalPrice)}) · {l.quantityLeft}/{l.quantity} left</p>
                </div>
                {l.status === 'ACTIVE' && <div className="flex items-center gap-3"><Countdown to={l.saleEndsAt} /><Button size="sm" variant="link" onClick={() => cancel(l.id)}>Cancel</Button></div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'new' && (
        <form onSubmit={submit} className={cx(box, 'mt-5 grid gap-4 sm:p-7')}>
          <h2 className="text-2xl font-extrabold">List something before it spoils</h2>
          <Field label="What is it?"><Input required placeholder="e.g. Party jollof rice and chicken, 10 packs" value={f.title} onChange={set('title')} /></Field>
          <Field label="Details" hint="When it was made, how it was stored, allergens"><Textarea value={f.description} onChange={set('description')} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Select required value={f.category} onChange={set('category')}><option value="">Choose…</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="City"><Select required value={f.city} onChange={set('city')}><option value="">Choose…</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          </div>
          <Field label="Area" hint="Shown publicly, e.g. Lekki Phase 1"><Input required value={f.area} onChange={set('area')} /></Field>
          <Field label="Full pickup address" hint="Only shown to buyers after they reserve"><Input required value={f.address} onChange={set('address')} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Normal price (₦)"><Input required type="number" min="100" value={f.originalPrice} onChange={set('originalPrice')} /></Field>
            <Field label="Your price (₦)"><Input required type="number" min="50" value={f.price} onChange={set('price')} /></Field>
            <Field label="How many"><Input required type="number" min="1" max="200" value={f.quantity} onChange={set('quantity')} /></Field>
          </div>
          {disc !== null && <p className={cx('w-fit rounded-full px-4 py-1.5 text-sm font-bold', disc >= 30 ? 'bg-leaf/10 text-leaf' : 'bg-pepper/10 text-pepper')}>{disc >= 30 ? `${disc}% off. Great deal!` : `${disc}% off. Needs at least 30% off.`}</p>}
          <div>
            <p className="mb-2 text-sm font-semibold">Quick timing: sale ends in</p>
            <div className="flex flex-wrap gap-2">{[1, 3, 6, 12, 24].map((h) => <Chip key={h} onClick={() => preset(h)}>{h}h</Chip>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sale ends" hint="Last time buyers can reserve"><Input required type="datetime-local" value={f.saleEndsAt} onChange={set('saleEndsAt')} /></Field>
            <Field label="Pickup deadline" hint="Buyers must collect by this time"><Input required type="datetime-local" value={f.pickupBy} onChange={set('pickupBy')} /></Field>
          </div>
          {err && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{err}</p>}
          <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Publish listing'}</Button>
        </form>
      )}
    </div>
  );
}
