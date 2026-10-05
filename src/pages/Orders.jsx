import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Art, StatusBadge, mapsUrl, naira, when } from '../components';
import { Button, Chip, useToast } from '../ui';

export default function Orders() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('active');
  const load = () => api('/orders/mine').then(setOrders).catch((e) => { toast(e.message, 'err'); setOrders([]); });
  useEffect(() => { if (!user) return nav('/auth'); if (user.role !== 'BUYER') return nav('/seller'); load(); }, [user]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try { await api(`/orders/${id}/cancel`, { method: 'PATCH' }); toast('Reservation cancelled.'); load(); } catch (e) { toast(e.message, 'err'); }
  };

  const active = orders?.filter((o) => o.status === 'RESERVED') || [];
  const past = orders?.filter((o) => o.status !== 'RESERVED') || [];
  const shown = tab === 'active' ? active : past;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold">My orders</h1>
      <p className="mt-1 text-mute">Show your code to the seller when you collect, then pay them directly.</p>
      <div className="mt-6 flex gap-2">
        <Chip on={tab === 'active'} onClick={() => setTab('active')}>Active ({active.length})</Chip>
        <Chip on={tab === 'past'} onClick={() => setTab('past')}>Past ({past.length})</Chip>
      </div>

      {!orders && <div className="mt-6 grid animate-pulse gap-4"><div className="h-44 rounded-2xl bg-line/70" /><div className="h-44 rounded-2xl bg-line/70" /></div>}
      {orders && shown.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center ring-[1.5px] ring-line">
          <div className="text-5xl">🧾</div>
          <p className="mt-3 text-xl font-bold">{tab === 'active' ? 'No active reservations' : 'No past orders yet'}</p>
          <p className="mt-1 text-mute">Browse live deals and reserve something before it is gone.</p>
          <Button as={Link} to="/#deals" className="mt-5">See live deals</Button>
        </div>
      )}

      <ul className="mt-6 grid gap-4">
        {shown.map((o) => (
          <li key={o.id} className="rounded-2xl bg-white p-5 ring-[1.5px] ring-line">
            <div className="flex items-start gap-4">
              <Art c={o.listing.category} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="text-lg">{o.quantity} × {o.listing.title}</b><StatusBadge s={o.status} /></div>
                <p className="text-sm text-mute">{o.listing.seller.businessName} · {naira(o.totalPrice)} to pay at pickup</p>
              </div>
            </div>
            {o.status === 'RESERVED' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p>Collect by <b>{when(o.listing.pickupBy)}</b></p>
                  <p className="text-mute">{o.listing.address}, {o.listing.area}, {o.listing.city}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button as="a" size="sm" variant="outline" target="_blank" rel="noreferrer" href={mapsUrl(`${o.listing.address}, ${o.listing.area}, ${o.listing.city}`)}>Get directions</Button>
                    <Button as="a" size="sm" variant="outline" href={'tel:' + o.listing.seller.phone}>Call seller</Button>
                    <Button size="sm" variant="link" onClick={() => cancel(o.id)}>Cancel</Button>
                  </div>
                </div>
                <div className="rounded-xl bg-leaf p-4 text-center text-white">
                  <span className="text-sm">Show this code</span>
                  <div className="font-display text-4xl font-extrabold tracking-[.2em] text-palm">{o.pickupCode}</div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
