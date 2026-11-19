import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { StatusBadge, dateTimeLagos, naira } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { ListState, Pill, box, useActionDialog, useUrlParam } from './kit';

export const LISTING_STATUSES = [['ACTIVE', 'Live'], ['SOLD_OUT', 'Sold out'], ['EXPIRED', 'Ended'], ['CANCELLED', 'Cancelled'], ['', 'All']];

// Listings: hide/unhide (POST, reason required) keeps placed orders valid; Remove (older PATCH) cancels them.
export default function Listings() {
  const toast = useToast();
  const [status, setStatus] = useUrlParam('status', 'ACTIVE');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, openDialog] = useActionDialog();
  const load = useCallback(() => {
    setError(null);
    return api('/admin/listings?status=' + status)
      .then((rows) => setData({ items: Array.isArray(rows) ? rows : rows.items || [] }))
      .catch((e) => { setError(e); setData({ items: [] }); });
  }, [status]);
  useEffect(() => { setData(null); load(); }, [load]);

  const hide = (l) =>
    openDialog({
      title: `Hide "${l.title}"?`,
      body: <p>It disappears from the site and cannot be ordered. Orders already placed stay valid. The seller is emailed your reason.</p>,
      reasonLabel: 'Why are you hiding this listing?',
      reasonHint: 'The seller sees this.',
      confirmLabel: 'Hide listing',
      tone: 'danger',
      onConfirm: (reason) => api(`/admin/listings/${l.id}/hide`, { method: 'POST', body: { reason } }),
      onDone: () => { toast('Listing hidden'); load(); },
    });
  const unhide = (l) =>
    openDialog({
      title: `Show "${l.title}" again?`,
      body: <p>It shows on the site again if it is still live. No email is sent.</p>,
      reasonLabel: 'Why are you showing it again?',
      confirmLabel: 'Unhide listing',
      onConfirm: (reason) => api(`/admin/listings/${l.id}/unhide`, { method: 'POST', body: { reason } }),
      onDone: () => { toast('Listing shown again'); load(); },
    });
  const remove = (l) =>
    openDialog({
      title: `Remove "${l.title}"?`,
      body: <p>This cancels the listing and its open orders. Paid orders go on the Refunds list. To keep orders valid, hide it instead.</p>,
      confirmLabel: 'Remove listing',
      tone: 'danger',
      onConfirm: () => api(`/admin/listings/${l.id}/remove`, { method: 'PATCH' }),
      onDone: () => { toast('Listing removed'); load(); },
    });

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Listing status">
        {LISTING_STATUSES.map(([v, t]) => <Chip key={v} on={status === v} aria-pressed={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}
      </div>
      <ListState data={data} error={error} />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((l) => (
          <li key={l.id} className={cx(box, 'grid gap-3', l.hiddenAt && 'bg-paper ring-pepper/40')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="[overflow-wrap:anywhere]">{l.title}</b>
                <StatusBadge s={l.status} listing />
                {l.hiddenAt && <Pill tone="bg-pepper text-white">Hidden by GbaanJo</Pill>}
              </div>
              {l.hiddenAt && (
                <p className="mt-1 text-sm text-pepper">Hidden {dateTimeLagos(l.hiddenAt)}{l.hiddenReason ? `: ${l.hiddenReason}` : ''}</p>
              )}
              <p className="[overflow-wrap:anywhere] text-sm text-mute">{l.seller?.businessName}{l.seller?.verified ? ' (verified)' : ''} · {l.seller?.phone}</p>
              <p className="[overflow-wrap:anywhere] text-sm text-mute">{naira(l.price)} (was {naira(l.originalPrice)}) · {l.quantityLeft}/{l.quantity} left · {l.area}, {l.city}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {l.hiddenAt ? (
                <Button size="sm" variant="leaf" onClick={() => unhide(l)}>Unhide</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => hide(l)}>Hide</Button>
              )}
              {(l.status === 'ACTIVE' || l.status === 'SOLD_OUT') && <Button size="sm" variant="outline" onClick={() => remove(l)}>Remove</Button>}
            </div>
          </li>
        ))}
      </ul>
      {dialog}
    </div>
  );
}
