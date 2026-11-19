import { useEffect, useState } from 'react';
import { api } from '../../api';
import { naira } from '../../components';
import { Button, cx, useToast } from '../../ui';
import { box } from './kit';

export default function Refunds() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const load = () => api('/admin/refunds').then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const done = async (id) => {
    if (!window.confirm('Only click this after you have refunded the payment in your payment dashboard. Continue?')) return;
    try { await api(`/admin/orders/${id}/refunded`, { method: 'PATCH' }); toast('Marked as refunded'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <div className="mt-5">
      <p className="rounded-xl bg-palm/25 p-4 text-sm"><b>How to refund:</b> open your payment dashboard (the OPay merchant dashboard if you use OPay), find the payment with the reference below, and refund it. Then come back here and click "Mark refunded".</p>
      {items && items.length === 0 && <p className="mt-6 text-mute">No refunds waiting. 🎉</p>}
      <ul className="mt-4 grid gap-3">
        {items?.map((o) => (
          <li key={o.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <b>{naira(o.amountPaid || o.totalPrice)} · {o.orderNo} · {o.listing.title}</b>
              <p className="text-sm text-mute">{o.buyer.name} · {o.buyer.email} · {o.buyer.phone}</p>
              <p className="break-all text-sm text-mute">Seller: {o.listing.seller.businessName} · Reference: <span className="font-mono text-ink">{o.paymentRef}</span>{o.opayOrderNo ? ` · OPay order ${o.opayOrderNo}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(o.paymentRef).then(() => toast('Reference copied'))}>Copy reference</Button>
              <Button size="sm" onClick={() => done(o.id)}>Mark refunded</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
