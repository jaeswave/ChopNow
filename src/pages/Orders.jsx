import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Art, Countdown, StatusBadge, mapsUrl, naira, when } from '../components';
import { Button, Chip, useToast } from '../ui';

export default function Orders() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('active');
  const [hold, setHold] = useState(10);

  const load = () => api('/orders/mine').then(setOrders).catch((e) => { toast(e.message, 'err'); setOrders([]); });
  useEffect(() => {
    if (!user) return nav('/auth');
    if (user.role !== 'BUYER') return nav(user.role === 'ADMIN' ? '/admin' : '/seller');
    load(); api('/listings/meta').then((m) => setHold(m.rules.HOLD_MINUTES)).catch(() => {});
  }, [user]);

  const cancel = async (o) => {
    if (!window.confirm(o.status === 'RESERVED' ? 'Cancel this order and request a refund?' : 'Cancel this reservation?')) return;
    try { const r = await api(`/orders/${o.id}/cancel`, { method: 'PATCH' }); toast(r.refund ? 'Cancelled. Your refund has been requested.' : 'Reservation cancelled.'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const share = async (o) => {
    const text = `Please collect my GbaanJo order ${o.orderNo}: ${o.quantity} × ${o.listing.title} from ${o.listing.seller.businessName}, ${o.listing.address}, ${o.listing.area}. Pickup code: ${o.pickupCode}. Collect by ${when(o.listing.pickupBy)}.`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /* cancelled */ } }
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const active = orders?.filter((o) => ['PENDING_PAYMENT', 'RESERVED'].includes(o.status)) || [];
  const past = orders?.filter((o) => !['PENDING_PAYMENT', 'RESERVED'].includes(o.status)) || [];
  const shown = tab === 'active' ? active : past;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold">My orders</h1>
      <p className="mt-1 text-mute">Show your code to the seller when you collect. It is already paid for.</p>
      <div className="mt-6 flex gap-2">
        <Chip on={tab === 'active'} onClick={() => setTab('active')}>Active ({active.length})</Chip>
        <Chip on={tab === 'past'} onClick={() => setTab('past')}>Past ({past.length})</Chip>
      </div>

      {!orders && <div className="mt-6 grid animate-pulse gap-4"><div className="h-44 rounded-2xl bg-line/70" /><div className="h-44 rounded-2xl bg-line/70" /></div>}
      {orders && shown.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center ring-[1.5px] ring-line">
          <div className="text-5xl">🧾</div>
          <p className="mt-3 text-xl font-bold">{tab === 'active' ? 'No active orders' : 'No past orders yet'}</p>
          <p className="mt-1 text-mute">Browse live deals and grab something before it is gone.</p>
          <Button as={Link} to="/#deals" className="mt-5">See live deals</Button>
        </div>
      )}

      <ul className="mt-6 grid gap-4">
        {shown.map((o) => {
          const paid = ['RESERVED', 'PICKED_UP'].includes(o.status);
          return (
            <li key={o.id} className="rounded-2xl bg-white p-5 ring-[1.5px] ring-line">
              <div className="flex items-start gap-4">
                <Art c={o.listing.category} src={o.listing.imageUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><b className="text-lg">{o.quantity} × {o.listing.title}</b><StatusBadge s={o.status} /></div>
                  <p className="text-sm text-mute">{o.listing.seller.businessName} · {naira(o.amountPaid || o.totalPrice)}{paid ? ' paid' : ''}{o.orderNo ? ` · Order ${o.orderNo}` : ''}</p>
                  {o.refundedAt && <p className="mt-1 text-sm font-semibold text-leaf">Refunded</p>}
                  {o.refundDue && <p className="mt-1 text-sm font-semibold text-[#7a5300]">Refund in progress. We process refunds within 1 to 3 working days.</p>}
                </div>
              </div>

              {o.status === 'PENDING_PAYMENT' && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-palm/20 p-4">
                  <span className="font-semibold">Pay within</span>
                  <Countdown to={new Date(new Date(o.createdAt).getTime() + hold * 60000)} ended="Hold expired" />
                  <span className="text-sm text-mute">or the food goes back on sale.</span>
                  <div className="flex w-full flex-wrap gap-2 pt-1">
                    {o.payUrl && <Button as="a" href={o.payUrl} size="sm">Complete payment</Button>}
                    <Button size="sm" variant="link" onClick={() => cancel(o)}>Cancel</Button>
                  </div>
                </div>
              )}

              {o.status === 'RESERVED' && (
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p>Collect by <b>{when(o.listing.pickupBy)}</b></p>
                    <p className="text-mute">{o.listing.address}, {o.listing.area}, {o.listing.city}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button as="a" size="sm" variant="outline" target="_blank" rel="noreferrer" href={mapsUrl(`${o.listing.address}, ${o.listing.area}, ${o.listing.city}`)}>Get directions</Button>
                      <Button as="a" size="sm" variant="outline" href={'tel:' + o.listing.seller.phone}>Call seller</Button>
                      {new Date(o.listing.saleEndsAt) > new Date() && <Button size="sm" variant="link" onClick={() => cancel(o)}>Cancel and refund</Button>}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="rounded-xl bg-leaf p-4 text-center text-white">
                      <span className="text-sm">Pickup code · {o.orderNo}</span>
                      <div className="font-display text-4xl font-extrabold tracking-[.2em] text-palm">{o.pickupCode}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => share(o)}>Send code to someone</Button>
                    <p className="max-w-[16rem] text-xs text-mute">Whoever shows this code gets the food, so only share it with someone you trust.</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
