import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { StatusBadge, naira } from '../components';
import { Button, Chip, Input, cx, useToast } from '../ui';

const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line';
const Stat = ({ label, value, tone = '' }) => (
  <div className={cx(box, 'p-4')}><p className="text-sm text-mute">{label}</p><p className={cx('font-display text-3xl font-extrabold', tone)}>{value}</p></div>
);
const Pill = ({ children, tone = 'bg-paper text-ink' }) => <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', tone)}>{children}</span>;

function Overview() {
  const [s, setS] = useState(null);
  const toast = useToast();
  useEffect(() => { api('/admin/overview').then(setS).catch((e) => toast(e.message, 'err')); }, []);
  if (!s) return <div className="mt-5 h-32 animate-pulse rounded-2xl bg-line/70" />;
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="GbaanJo fees earned" value={naira(s.fees)} tone="text-leaf" /><Stat label="Total sales (paid)" value={naira(s.sales)} />
      <Stat label="Refunds to process" value={s.refundsPending} tone={s.refundsPending ? 'text-pepper' : ''} /><Stat label="Orders paid today" value={s.ordersToday} />
      <Stat label="Buyers" value={s.buyers} /><Stat label="Sellers" value={s.sellers} />
      <Stat label="Live listings" value={s.activeListings} /><Stat label="Suspended accounts" value={s.suspended} tone={s.suspended ? 'text-pepper' : ''} />
      <Stat label="Picked up (all time)" value={s.pickedUp} /><Stat label="No-shows (all time)" value={s.noShows} tone={s.noShows ? 'text-pepper' : ''} />
    </div>
  );
}

function Refunds() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const load = () => api('/admin/refunds').then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const done = async (id) => {
    if (!window.confirm('Only click this after you have refunded the payment in your Paystack dashboard. Continue?')) return;
    try { await api(`/admin/orders/${id}/refunded`, { method: 'PATCH' }); toast('Marked as refunded'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <div className="mt-5">
      <p className="rounded-xl bg-palm/25 p-4 text-sm"><b>How to refund:</b> open your Paystack Dashboard, go to Transactions, search the reference below, and click Refund. Then come back here and click "Mark refunded".</p>
      {items && items.length === 0 && <p className="mt-6 text-mute">No refunds waiting. 🎉</p>}
      <ul className="mt-4 grid gap-3">
        {items?.map((o) => (
          <li key={o.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <b>{naira(o.amountPaid || o.totalPrice)} · {o.orderNo} · {o.listing.title}</b>
              <p className="text-sm text-mute">{o.buyer.name} · {o.buyer.email} · {o.buyer.phone}</p>
              <p className="break-all text-sm text-mute">Seller: {o.listing.seller.businessName} · Reference: <span className="font-mono text-ink">{o.paystackRef}</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(o.paystackRef).then(() => toast('Reference copied'))}>Copy reference</Button>
              <Button size="sm" onClick={() => done(o.id)}>Mark refunded</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Users() {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(null);
  const load = () => api(`/admin/users?role=${role}&q=${encodeURIComponent(q)}`).then(setUsers).catch((e) => toast(e.message, 'err'));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [role, q]);

  const act = async (path, body, msg, ask) => {
    if (ask && !window.confirm(ask)) return;
    try { await api(path, { method: 'PATCH', body }); toast(msg); load(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">{[['', 'Everyone'], ['SELLER', 'Sellers'], ['BUYER', 'Buyers']].map(([v, t]) => <Chip key={v} on={role === v} onClick={() => setRole(v)}>{t}</Chip>)}</div>
        <Input className="min-w-56 flex-1" placeholder="Search name, email or business…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {users && users.length === 0 && <p className="mt-6 text-mute">No users found.</p>}
      <ul className="mt-4 grid gap-3">
        {users?.map((u) => (
          <li key={u.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b>{u.businessName || u.name}</b><Pill>{u.role}</Pill>
                {u.verified && <Pill tone="bg-leaf/10 text-leaf">Verified</Pill>}
                {u.suspended && <Pill tone="bg-pepper/10 text-pepper">Suspended</Pill>}
              </div>
              <p className="text-sm text-mute">{u.name} · {u.email} · {u.phone}</p>
              <p className="text-sm text-mute">No-shows: {u.noShows} · Joined {new Date(u.createdAt).toLocaleDateString('en-NG')}{u.role === 'SELLER' ? ` · Payout: ${u.accountName ? `${u.accountName} (${u.bankName})` : 'not set up'}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.role === 'SELLER' && <Button size="sm" variant="outline" onClick={() => act(`/admin/users/${u.id}/verify`, { value: !u.verified }, u.verified ? 'Verification removed' : 'Seller verified')}>{u.verified ? 'Unverify' : 'Verify'}</Button>}
              {u.noShows > 0 && <Button size="sm" variant="outline" onClick={() => act(`/admin/users/${u.id}/reset-noshows`, undefined, 'No-shows reset')}>Reset no-shows</Button>}
              <Button size="sm" variant={u.suspended ? 'leaf' : 'outline'} onClick={() => act(`/admin/users/${u.id}/suspend`, { value: !u.suspended }, u.suspended ? 'Account restored' : 'Account suspended', !u.suspended && 'Suspend this account? Live listings and open orders will be cancelled, and paid orders will be queued for refund.')}>{u.suspended ? 'Restore' : 'Suspend'}</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Listings() {
  const toast = useToast();
  const [status, setStatus] = useState('ACTIVE');
  const [items, setItems] = useState(null);
  const load = () => api('/admin/listings?status=' + status).then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { setItems(null); load(); }, [status]);
  const remove = async (id) => {
    if (!window.confirm('Remove this listing? Paid orders will be queued for refund.')) return;
    try { await api(`/admin/listings/${id}/remove`, { method: 'PATCH' }); toast('Listing removed'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">{[['ACTIVE', 'Live'], ['SOLD_OUT', 'Sold out'], ['EXPIRED', 'Ended'], ['CANCELLED', 'Cancelled'], ['', 'All']].map(([v, t]) => <Chip key={v} on={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}</div>
      {items && items.length === 0 && <p className="mt-6 text-mute">Nothing here.</p>}
      <ul className="mt-4 grid gap-3">
        {items?.map((l) => (
          <li key={l.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><b>{l.title}</b><StatusBadge s={l.status} listing /></div>
              <p className="text-sm text-mute">{l.seller.businessName}{l.seller.verified ? ' (verified)' : ''} · {l.seller.phone}</p>
              <p className="text-sm text-mute">{naira(l.price)} (was {naira(l.originalPrice)}) · {l.quantityLeft}/{l.quantity} left · {l.address}, {l.area}, {l.city}</p>
            </div>
            {(l.status === 'ACTIVE' || l.status === 'SOLD_OUT') && <Button size="sm" variant="outline" onClick={() => remove(l.id)}>Remove</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Applications() {
  const toast = useToast();
  const [status, setStatus] = useState('PENDING');
  const [items, setItems] = useState(null);
  const load = () => api('/admin/applications?status=' + status).then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { setItems(null); load(); }, [status]);

  const review = async (u, approve) => {
    let reason;
    if (approve) { if (!window.confirm(`Approve ${u.businessName}? Only continue if you checked ${u.rcNumber} on the CAC public search and the business name matches.`)) return; }
    else { reason = window.prompt('Why are you rejecting this application? The seller will see this message.'); if (!reason) return; }
    try { await api(`/admin/applications/${u.id}`, { method: 'PATCH', body: { approve, reason } }); toast(approve ? 'Seller approved and emailed' : 'Application rejected and emailed'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="mt-5">
      <p className="rounded-xl bg-palm/25 p-4 text-sm"><b>How to check:</b> copy the CAC number, open CAC's public search, paste it in, and confirm the registered name matches the business name below and the business is still active. Then approve or reject.</p>
      <div className="mt-4 flex gap-2">{[['PENDING', 'Pending'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected']].map(([v, t]) => <Chip key={v} on={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}</div>
      {items && items.length === 0 && <p className="mt-6 text-mute">Nothing here.</p>}
      <ul className="mt-4 grid gap-3">
        {items?.map((u) => (
          <li key={u.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><b>{u.businessName}</b>{u.emailVerifiedAt ? <Pill tone="bg-leaf/10 text-leaf">Email verified</Pill> : <Pill tone="bg-pepper/10 text-pepper">Email not verified</Pill>}</div>
              <p className="text-sm text-mute">CAC number: <span className="font-mono text-ink">{u.rcNumber}</span></p>
              <p className="text-sm text-mute">{u.name} · {u.email} · {u.phone} · applied {new Date(u.createdAt).toLocaleDateString('en-NG')}</p>
              {u.rejectionReason && <p className="text-sm text-pepper">Rejected: {u.rejectionReason}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as="a" size="sm" variant="outline" href="https://search.cac.gov.ng/home" target="_blank" rel="noreferrer">CAC search</Button>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(u.rcNumber).then(() => toast('Number copied'))}>Copy number</Button>
              {status !== 'APPROVED' && <Button size="sm" variant="leaf" onClick={() => review(u, true)}>Approve</Button>}
              {status === 'PENDING' && <Button size="sm" variant="outline" onClick={() => review(u, false)}>Reject</Button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('applications');
  useEffect(() => { if (user?.role !== 'ADMIN') nav('/'); }, [user]);
  if (user?.role !== 'ADMIN') return null;
  return (
    <div>
      <h1 className="text-4xl font-extrabold">Admin</h1>
      <p className="mt-1 text-mute">Keep GbaanJo safe and fair.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {[['applications', 'Seller applications'], ['overview', 'Overview'], ['refunds', 'Refunds'], ['users', 'Users'], ['listings', 'Listings']].map(([k, t]) => <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{t}</Chip>)}
      </div>
      {tab === 'applications' && <Applications />}
      {tab === 'overview' && <Overview />}
      {tab === 'refunds' && <Refunds />}
      {tab === 'users' && <Users />}
      {tab === 'listings' && <Listings />}
    </div>
  );
}
