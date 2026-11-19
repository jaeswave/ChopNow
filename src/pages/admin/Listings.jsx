import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatusBadge, naira } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { box } from './kit';

export default function Listings() {
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
