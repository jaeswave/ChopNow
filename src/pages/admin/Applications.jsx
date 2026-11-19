import { useEffect, useState } from 'react';
import { api } from '../../api';
import { dateLagos } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { Pill, box } from './kit';

export default function Applications() {
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
              <p className="text-sm text-mute">{u.name} · {u.email} · {u.phone} · applied {dateLagos(u.createdAt)}</p>
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
