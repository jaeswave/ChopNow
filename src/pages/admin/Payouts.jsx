import { useEffect, useState } from 'react';
import { api } from '../../api';
import { naira } from '../../components';
import { Button, cx, useToast } from '../../ui';
import { box } from './kit';

export default function Payouts() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const load = () => api('/admin/payouts').then(setRows).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const paid = async (r) => {
    if (!window.confirm(`Only click this after you have sent ${naira(r.owed)} to ${r.accountName} (${r.bankName}, ${r.accountNumber}). Continue?`)) return;
    try { await api('/admin/payouts/mark-paid', { method: 'POST', body: { orderIds: r.orderIds } }); toast('Marked as paid'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <div className="mt-5">
      <p className="rounded-xl bg-palm/25 p-4 text-sm"><b>How to pay sellers:</b> this lists what you owe each seller for orders that were handed over (or missed by the buyer), after your fee. Send the amount by bank transfer, then click "Mark paid" so it leaves this list.</p>
      {rows && rows.length === 0 && <p className="mt-6 text-mute">Nobody is owed anything right now. 🎉</p>}
      <ul className="mt-4 grid gap-3">
        {rows?.map((r) => (
          <li key={r.sellerId} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <b>{r.businessName}</b>
              <p className="text-sm text-mute">{r.accountName} · {r.bankName} · <span className="font-mono text-ink">{r.accountNumber}</span></p>
              <p className="text-sm text-mute">{r.orderIds.length} order{r.orderIds.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-2xl font-extrabold text-leaf">{naira(r.owed)}</span>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(r.accountNumber).then(() => toast('Account number copied'))}>Copy account</Button>
              <Button size="sm" onClick={() => paid(r)}>Mark paid</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
