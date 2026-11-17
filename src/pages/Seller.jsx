import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Art, Countdown, StatusBadge, naira, when } from '../components';
import { Button, Chip, Field, Input, Select, Spinner, Textarea, cx, tap, useToast } from '../ui';
import Payouts from './Payouts';
import SellerInsights from "../components/SellerInsights";
import SetupChecklist from './seller/SetupChecklist';
import SetupBlocker from './seller/SetupBlocker';
import useResendVerification from './seller/useResendVerification';
import { clearDraft, loadDraft, restoreForm, saveDraft } from './seller/draft';
import { setupBlockFromError } from './seller/errors';
import { fromLagosInput, lagosInputInHours, toLagosInput } from '../components/time';
import ApplicationTimeline from './seller/ApplicationTimeline';

// The sale and pickup inputs are in Lagos time, whatever the phone's time zone (see components/time.js)
const blankForm = () => ({ title: '', description: '', imageUrl: '', category: '', city: '', area: '', address: '', originalPrice: '', price: '', quantity: '', saleEndsAt: lagosInputInHours(3), pickupBy: lagosInputInHours(5) });
const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line';

// The open tab lives in the URL (?tab=payouts), so links and emails can open a tab and Back works
const TABS = ['orders', 'listings', 'new', 'insights', 'payouts'];
const DEFAULT_TAB = 'orders';

const Stat = ({ label, value, tone = '' }) => (
  <div className={cx(box, 'p-4')}><p className="text-sm text-mute">{label}</p><p className={cx('font-display text-3xl font-extrabold', tone)}>{value}</p></div>
);

/* Shown instead of the dashboard until the application is approved */
function Application({ user }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const [name, setName] = useState(user.businessName || '');
  const [rc, setRc] = useState('');
  const [busy, setBusy] = useState(false);
  const rejected = user.approvalStatus === 'REJECTED';

  const resubmit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api('/auth/resubmit', { method: 'POST', body: { businessName: name, rcNumber: rc } }); toast('Application resubmitted. We will review it.'); await refresh(); }
    catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className={cx(box, 'text-center sm:p-8')}>
        <div className="text-6xl">{rejected ? '📝' : '🔎'}</div>
        <h1 className="mt-3 text-3xl font-extrabold">{rejected ? 'We need you to fix something' : 'Your application is under review'}</h1>
        {!rejected && <p className="mt-2 text-mute">We are checking the CAC number for <b className="text-ink">{user.businessName}</b>. We will email you the moment it is approved. After that you can add your payout account, upload food photos and start listing.</p>}
        {rejected && <p className="mt-2 rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{user.rejectionReason || 'Please check your details and resubmit.'}</p>}
        {!user.emailVerified && <p className="mt-4 rounded-xl bg-palm/25 p-3 text-sm font-semibold">Please also verify your email using the link we sent you. We cannot approve you until you do.</p>}
      </div>
      <ApplicationTimeline user={user} />
      {rejected && (
        <form onSubmit={resubmit} className={cx(box, 'mt-4 grid gap-4')}>
          <Field label="Business name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="CAC registration number" hint="RC or BN number, e.g. RC1234567"><Input required value={rc} onChange={(e) => setRc(e.target.value)} placeholder="RC1234567" /></Field>
          <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Resubmit application'}</Button>
        </form>
      )}
    </div>
  );
}

/* Seller types the pickup code the customer shows */
function Redeem({ reload }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);

  const find = async (e) => {
    e.preventDefault(); setBusy(true); setFound(null);
    try { setFound(await api('/orders/lookup', { method: 'POST', body: { code } })); } catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };
  const confirm = async () => {
    setBusy(true);
    try { await api(`/orders/${found.id}/complete`, { method: 'POST', body: { code } }); toast('Handover confirmed. Nice one!'); setFound(null); setCode(''); reload(); }
    catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className={cx(box, 'bg-leaf/5')}>
      <h2 className="text-xl font-extrabold">Customer at your door?</h2>
      <p className="text-sm text-mute">Ask for the 6-digit pickup code. It works for whoever the buyer sent to collect.</p>
      <form onSubmit={find} className="mt-3 flex flex-wrap gap-2">
        <Input aria-label="Pickup code" className="w-44 text-lg tracking-[.3em]" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        <Button disabled={busy || code.length !== 6}>{busy && !found ? <Spinner /> : 'Find order'}</Button>
      </form>
      {found && (
        <div className="mt-4 rounded-xl bg-white p-4 ring-2 ring-leaf">
          <p className="text-sm text-mute">Order {found.orderNo}</p>
          <p className="text-lg font-bold">{found.quantity} × {found.title}</p>
          <p className="text-sm text-mute">Ordered by {found.buyerName}</p>
          <Button className="mt-3" disabled={busy} onClick={confirm}>{busy ? <Spinner /> : 'Hand over and confirm'}</Button>
        </div>
      )}
    </div>
  );
}

export default function Seller() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState({ categories: [], cities: [] });
  const [mine, setMine] = useState(null);
  const [orders, setOrders] = useState(null);
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : DEFAULT_TAB;
  const setTab = (t) => setParams(t === DEFAULT_TAB ? {} : { tab: t });
  const [hasPayout, setHasPayout] = useState(null); // null until /payouts/me answers, and stays null if it fails
  const [payoutChecked, setPayoutChecked] = useState(false);
  const [payoutJustSaved, setPayoutJustSaved] = useState(false);
  // Set when the server refuses a listing with EMAIL_NOT_VERIFIED while our copy of the user still says verified.
  // Cleared whenever the user is reloaded, so the server's answer wins.
  const [emailBlocked, setEmailBlocked] = useState(false);
  useEffect(() => setEmailBlocked(false), [user]);
  const emailVerified = !!user?.emailVerified && !emailBlocked;
  const verification = useResendVerification();
  const [f, setF] = useState(() => restoreForm(loadDraft(user?.id), blankForm()));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Every edit is also saved as a draft, so nothing is lost if the seller leaves the form for a moment
  const change = (patch) => setF((p) => { const next = { ...p, ...patch }; saveDraft(user?.id, next); return next; });
  const set = (k) => (e) => change({ [k]: e.target.value });
  const approved = user?.approvalStatus === 'APPROVED';

  const reload = () => Promise.all([api('/listings/mine/all').then(setMine), api('/orders/seller').then(setOrders)]).catch((e) => toast(e.message, 'err'));
  useEffect(() => {
    if (!user) return nav('/auth');
    if (user.role !== 'SELLER') return nav('/');
    if (!approved) return;
    api('/listings/meta').then((m) => setMeta({ categories: m.categories || [], cities: m.cities || [], rules: m.rules })).catch(() => {}); reload();
    api('/payouts/me').then((p) => setHasPayout(!!p.hasPayout)).catch(() => {}).finally(() => setPayoutChecked(true));
  }, [user?.id, user?.role, approved]); // not [user]: refreshing the same user must not reload everything

  // Not verified yet? They will click the link in another tab, so check again when they come back to this one.
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refresh]);

  if (!user || user.role !== 'SELLER') return null;
  if (!approved) return <Application user={user} />;

  const preset = (h) => { const end = Date.now() + h * 36e5; change({ saleEndsAt: toLagosInput(end), pickupBy: toLagosInput(end + 2 * 36e5) }); };
  const disc = f.originalPrice && f.price ? Math.round((1 - f.price / f.originalPrice) * 100) : null;

  // Photos go straight to Cloudinary. Our server only signs the request.
  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast('Please choose a JPG, PNG or WebP photo', 'err');
    if (file.size > 4 * 1024 * 1024) return toast('The photo must be under 4 MB', 'err');
    setUploading(true);
    try {
      const s = await api('/uploads/sign', { method: 'POST' });
      const fd = new FormData();
      fd.append('file', file); fd.append('api_key', s.apiKey); fd.append('timestamp', s.timestamp); fd.append('folder', s.folder); fd.append('signature', s.signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Upload failed');
      change({ imageUrl: d.secure_url });
    } catch (e) { toast(e.message, 'err'); }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/listings', { method: 'POST', body: {
        ...f, imageUrl: f.imageUrl || undefined, originalPrice: Number(f.originalPrice), price: Number(f.price), quantity: Number(f.quantity),
        saleEndsAt: fromLagosInput(f.saleEndsAt).toISOString(), pickupBy: fromLagosInput(f.pickupBy).toISOString(),
      } });
      toast('Your listing is live!');
      clearDraft(user.id);
      setF({ ...blankForm(), category: f.category, city: f.city, area: f.area, address: f.address });
      await reload(); setTab('listings');
    } catch (e2) {
      // A missing setup step shows the same friendly card as before the form. The draft is kept.
      const block = setupBlockFromError(e2);
      if (block === 'payout') setHasPayout(false);
      if (block === 'email') { setEmailBlocked(true); refresh(); }
      if (block) requestAnimationFrame(() => document.getElementById('blocker-title')?.scrollIntoView?.({ block: 'center' }));
      else setErr(e2.message);
    }
    setBusy(false);
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this listing? Paid orders will be refunded.')) return;
    try { await api(`/listings/${id}/cancel`, { method: 'PATCH' }); toast('Listing cancelled.'); reload(); } catch (e) { toast(e.message, 'err'); }
  };

    const relist = async (id) => {
      try {
        await api(`/listings/${id}/duplicate`, { method: "POST", body: {} });
        toast("Relisted. It is live for the next 3 hours.");
        reload();
      } catch (e) {
        toast(e.message, "err");
      }
    };

  const awaiting = orders?.filter((o) => o.status === 'RESERVED') || [];
  const earned = orders?.filter((o) => ['RESERVED', 'PICKED_UP', 'EXPIRED'].includes(o.status)).reduce((s, o) => s + o.sellerAmount, 0) || 0;

  // Only shown once we know every answer, so it never shows a wrong tick
  const setupSteps = [
    { label: 'Verify your email', hint: 'Open the link we emailed you.', done: emailVerified,
      action: { label: 'Resend email', onClick: verification.resend, busy: verification.busy } },
    { label: 'Add your payout account', hint: 'Tell us which bank account to pay your earnings into.', done: hasPayout === true,
      action: { label: 'Add payout account', onClick: () => setTab('payouts') } },
    { label: 'Publish your first listing', hint: 'List food you want to sell today.', done: !!mine?.length,
      action: { label: 'New listing', onClick: () => setTab('new') } },
  ];
  const showSetup = payoutChecked && hasPayout !== null && mine !== null && setupSteps.some((s) => !s.done);

  // What stops the seller from listing right now. If /payouts/me failed we show the form and let the server decide.
  const blocker = !emailVerified ? 'email' : !payoutChecked ? 'loading' : hasPayout === false ? 'payout' : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-extrabold">{user.businessName}</h1>
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-sm font-bold text-leaf">
          ✓ Verified seller
        </span>
      </div>
      <p className="mt-1 text-mute">
        Manage your listings and hand over orders.
      </p>

      {showSetup && <SetupChecklist steps={setupSteps} />}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Live listings"
          value={mine ? mine.filter((l) => l.status === "ACTIVE").length : "–"}
        />
        <Stat
          label="Awaiting pickup"
          value={orders ? awaiting.length : "–"}
          tone={awaiting.length ? "text-pepper" : ""}
        />
        <Stat
          label="Handed over"
          value={
            orders ? orders.filter((o) => o.status === "PICKED_UP").length : "–"
          }
        />
        <Stat
          label="Earned (after fees)"
          value={orders ? naira(earned) : "–"}
          tone="text-leaf"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Chip on={tab === "orders"} onClick={() => setTab("orders")}>
          Orders ({awaiting.length})
        </Chip>
        <Chip on={tab === "listings"} onClick={() => setTab("listings")}>
          My listings
        </Chip>
        <Chip on={tab === "new"} onClick={() => setTab("new")}>
          + New listing
        </Chip>
        <Chip on={tab === "insights"} onClick={() => setTab("insights")}>
          Insights
        </Chip>
        <Chip on={tab === "payouts"} onClick={() => setTab("payouts")}>
          Payouts
        </Chip>
      </div>

      {tab === "orders" && (
        <div className="mt-5 grid gap-4">
          <Redeem reload={reload} />
          {orders && orders.length === 0 && (
            <div className={cx(box, "p-10 text-center")}>
              <div className="text-5xl">📦</div>
              <p className="mt-3 text-xl font-bold">No orders yet</p>
              <p className="mt-1 text-mute">
                When buyers pay for your food, it shows up here with an order
                number.
              </p>
            </div>
          )}
          <ul className="grid gap-3">
            {orders?.map((o) => (
              <li
                key={o.id}
                className={cx(
                  box,
                  "flex flex-wrap items-center justify-between gap-3",
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b>
                      {o.quantity} × {o.listing.title}
                    </b>
                    <StatusBadge s={o.status} />
                  </div>
                  <p className="text-sm text-mute">
                    Order {o.orderNo} · {o.buyer.name} · you get{" "}
                    {naira(o.sellerAmount)} · collect by{" "}
                    {when(o.listing.pickupBy)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "listings" && (
        <div className="mt-5">
          {mine && mine.length === 0 && (
            <div className={cx(box, "p-10 text-center")}>
              <div className="text-5xl">🍳</div>
              <p className="mt-3 text-xl font-bold">
                You haven't listed anything yet
              </p>
              <Button className="mt-4" onClick={() => setTab("new")}>
                List your first item
              </Button>
            </div>
          )}
          <ul className="grid gap-3">
            {mine?.map((l) => (
              <li
                key={l.id}
                className={cx(box, "flex flex-wrap items-center gap-4")}
              >
                <Art c={l.category} src={l.imageUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{l.title}</b>
                    <StatusBadge s={l.status} listing />
                  </div>
                  <p className="text-sm text-mute">
                    {naira(l.price)} (was {naira(l.originalPrice)}) ·{" "}
                    {l.quantityLeft}/{l.quantity} left
                  </p>
                </div>
                {l.status === "ACTIVE" && (
                  <div className="flex items-center gap-3">
                    <Countdown to={l.saleEndsAt} />
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => cancel(l.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => relist(l.id)}
                >
                  Relist
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "insights" && <SellerInsights />}

      {tab === "payouts" && payoutJustSaved && (
        <div role="status" className={cx(box, "mt-5 flex flex-wrap items-center justify-between gap-3 bg-leaf/5 ring-leaf")}>
          <p className="font-semibold text-leaf">✓ Payout account saved. You can publish listings now.</p>
          <Button onClick={() => setTab("new")}>
            Continue to your listing
          </Button>
        </div>
      )}

      {tab === "payouts" && (
        <Payouts
          onSaved={() => {
            setHasPayout(true);
            setPayoutJustSaved(true);
          }}
        />
      )}

      {tab === "new" && blocker === "loading" && (
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-line/70" />
      )}

      {tab === "new" && blocker === "email" && (
        <SetupBlocker
          icon="✉️"
          title="One quick step first: verify your email"
          text="We emailed you a link. Open it, then come back to this page to list your food."
        >
          <Button disabled={verification.busy} onClick={verification.resend}>
            {verification.busy ? <Spinner /> : "Resend email"}
          </Button>
        </SetupBlocker>
      )}

      {tab === "new" && blocker === "payout" && (
        <SetupBlocker
          icon="🏦"
          title="One quick step first: tell us where to send your money"
          text="We pay your earnings into your bank account, so we need it before your food can go live. Anything you already typed in the form is kept."
        >
          <Button onClick={() => setTab("payouts")}>
            Add payout account
          </Button>
        </SetupBlocker>
      )}

      {tab === "new" && !blocker && (
        <form onSubmit={submit} className={cx(box, "mt-5 grid gap-4 sm:p-7")}>
          <h2 className="text-2xl font-extrabold">
            List something before it spoils
          </h2>

          <div>
            <p className="mb-2 text-sm font-semibold">Photo of the food</p>
            <div className="flex flex-wrap items-center gap-4">
              {f.imageUrl ? (
                <img
                  src={f.imageUrl}
                  alt=""
                  className="size-28 rounded-xl object-cover"
                />
              ) : (
                <div className="grid size-28 place-items-center rounded-xl bg-paper text-4xl">
                  📷
                </div>
              )}
              <div className="grid gap-2">
                <label className={cx(tap, "inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold ring-[1.5px] ring-line focus-within:outline-3 focus-within:outline-palm hover:ring-leaf")}>
                  {uploading ? (
                    <Spinner />
                  ) : f.imageUrl ? (
                    "Change photo"
                  ) : (
                    "Upload photo"
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => upload(e.target.files[0])}
                  />
                </label>
                <p className="text-xs text-mute">
                  A clear photo sells faster. JPG, PNG or WebP, under 4 MB.
                </p>
              </div>
            </div>
          </div>

          <Field label="What is it?">
            <Input
              required
              placeholder="e.g. Party jollof rice and chicken, 10 packs"
              value={f.title}
              onChange={set("title")}
            />
          </Field>
          <Field
            label="Details"
            hint="When it was made, how it was stored, allergens"
          >
            <Textarea value={f.description} onChange={set("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select required value={f.category} onChange={set("category")}>
                <option value="">Choose…</option>
                {meta.categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Select required value={f.city} onChange={set("city")}>
                <option value="">Choose…</option>
                {meta.cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Area" hint="Shown publicly, e.g. Lekki Phase 1">
            <Input required value={f.area} onChange={set("area")} />
          </Field>
          <Field
            label="Full pickup address"
            hint="Only shown to buyers after they pay"
          >
            <Input required value={f.address} onChange={set("address")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Normal price (₦)">
              <Input
                required
                type="number"
                min="100"
                value={f.originalPrice}
                onChange={set("originalPrice")}
              />
            </Field>
            <Field label="Your price (₦)">
              <Input
                required
                type="number"
                min="50"
                value={f.price}
                onChange={set("price")}
              />
            </Field>
            <Field label="How many">
              <Input
                required
                type="number"
                min="1"
                max="200"
                value={f.quantity}
                onChange={set("quantity")}
              />
            </Field>
          </div>
          {disc !== null && (
            <p
              className={cx(
                "w-fit rounded-full px-4 py-1.5 text-sm font-bold",
                disc >= 30
                  ? "bg-leaf/10 text-leaf"
                  : "bg-pepper/10 text-pepper",
              )}
            >
              {disc >= 30
                ? `${disc}% off. Great deal!`
                : `${disc}% off. Needs at least 30% off.`}
            </p>
          )}
          <div>
            <p className="mb-2 text-sm font-semibold">
              Quick timing: sale ends in
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 6, 12, 24].map((h) => (
                <Chip key={h} onClick={() => preset(h)}>
                  {h}h
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sale ends (Lagos time)" hint="Last time buyers can order">
              <Input
                required
                type="datetime-local"
                value={f.saleEndsAt}
                onChange={set("saleEndsAt")}
              />
            </Field>
            <Field
              label="Pickup deadline (Lagos time)"
              hint="Buyers must collect by this time"
            >
              <Input
                required
                type="datetime-local"
                value={f.pickupBy}
                onChange={set("pickupBy")}
              />
            </Field>
          </div>
          {err && (
            <p
              role="alert"
              className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper"
            >
              {err}
            </p>
          )}
          {f.price > 0 &&
            (() => {
              const r = meta.rules || {};
              const unit = Number(f.price);
              const fee = Math.min(
                unit,
                Math.max(
                  r.MIN_FEE || 50,
                  Math.round((unit * (r.PLATFORM_FEE_PERCENT || 10)) / 100),
                ),
              );
              return (
                <p className="rounded-xl bg-paper p-3 text-sm">
                  GbaanJo's fee is <b>{r.PLATFORM_FEE_PERCENT || 10}%</b> per
                  sale (at least {naira(r.MIN_FEE || 50)}). On each unit you
                  receive about <b>{naira(unit - fee)}</b>, paid to your bank
                  account.
                </p>
              );
            })()}
          <Button size="lg" disabled={busy || uploading}>
            {busy ? <Spinner /> : "Publish listing"}
          </Button>
        </form>
      )}
    </div>
  );
}
