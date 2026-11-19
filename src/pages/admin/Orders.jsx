import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatusBadge, dateTimeLagos, naira, when } from '../../components';
import { Button, Field, Input, Select, cx, useToast } from '../../ui';
import { Dialog, ListState, Pager, Pill, box, useActionDialog, usePagedList, useUrlParam } from './kit';

export const ORDER_STATUSES = [
  ['', 'Any status'],
  ['PENDING_PAYMENT', 'Awaiting payment'],
  ['RESERVED', 'Paid, not collected'],
  ['PICKED_UP', 'Collected'],
  ['EXPIRED', 'Missed'],
  ['CANCELLED', 'Cancelled'],
];
const EVENTS = {
  created: 'Order placed',
  paid: 'Paid',
  reminder_sent: 'Pickup reminder sent',
  picked_up: 'Collected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  paid_out_to_seller: 'Seller paid',
};
const CANCELLABLE = ['PENDING_PAYMENT', 'RESERVED'];

// IMPORTANT: everything shown about an order is picked field by field below. Never print a whole order object:
// the pickup code must never appear on an admin screen.
const Row = ({ label, children }) => (
  <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-line py-2 last:border-0">
    <dt className="text-mute">{label}</dt>
    <dd className="min-w-0 [overflow-wrap:anywhere] text-right font-semibold">{children}</dd>
  </div>
);
const Section = ({ title, children }) => (
  <section className="mt-4">
    <h3 className="text-sm font-bold uppercase tracking-wide text-mute">{title}</h3>
    <dl className="mt-1">{children}</dl>
  </section>
);

function OrderDetail({ o, onClose, onCancel }) {
  const timeline = o.timeline || [];
  const hasCancelTime = timeline.some((t) => t.event === 'cancelled');
  return (
    <Dialog title={`Order ${o.orderNo}`} onClose={onClose}>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge s={o.status} />
        {o.refundDue && <Pill tone="bg-pepper/10 text-pepper">Refund owed</Pill>}
      </div>
      <Section title="Buyer">
        <Row label="Name">{o.buyer?.name}</Row>
        <Row label="Email">{o.buyer?.email}</Row>
        <Row label="Phone">{o.buyer?.phone}</Row>
      </Section>
      <Section title="Seller">
        <Row label="Business">{o.seller?.businessName}</Row>
        <Row label="Email">{o.seller?.email}</Row>
        <Row label="Phone">{o.seller?.phone}</Row>
      </Section>
      <Section title="Items">
        {(o.items || []).map((it) => (
          <Row key={it.listingId} label={`${it.quantity} × ${it.title}`}>{naira(it.unitPrice * it.quantity)}</Row>
        ))}
      </Section>
      <Section title="Amounts">
        <Row label="Food">{naira(o.amounts?.food ?? 0)}</Row>
        <Row label="Buyer service fee">{naira(o.amounts?.buyerFee ?? 0)}</Row>
        <Row label="Paid by buyer">{naira(o.amounts?.amountPaid ?? 0)}</Row>
        <Row label="GbaanJo fee">{naira(o.amounts?.platformFee ?? 0)}</Row>
        <Row label="Seller gets">{naira(o.amounts?.sellerAmount ?? 0)}</Row>
      </Section>
      <Section title="Pickup and payment">
        {o.pickupBy && <Row label="Collect by">{when(o.pickupBy)}</Row>}
        {o.paymentRef && <Row label="Payment reference"><span className="font-mono">{o.paymentRef}</span></Row>}
      </Section>
      <section className="mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-mute">Timeline (Lagos time)</h3>
        <ol className="mt-2 grid gap-1">
          {timeline.map((t) => (
            <li key={t.event + t.at} className="flex flex-wrap justify-between gap-x-4">
              <span>{EVENTS[t.event] || t.event}</span>
              <span className="text-mute">{dateTimeLagos(t.at)}</span>
            </li>
          ))}
          {/* Some cancels and every missed order have no exact time: show the last change instead */}
          {((o.status === 'CANCELLED' && !hasCancelTime) || o.status === 'EXPIRED') && o.lastChangedAt && (
            <li className="flex flex-wrap justify-between gap-x-4">
              <span>{o.status === 'EXPIRED' ? 'Missed' : 'Cancelled'} (last change)</span>
              <span className="text-mute">{dateTimeLagos(o.lastChangedAt)}</span>
            </li>
          )}
        </ol>
      </section>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" data-close onClick={onClose}>Close</Button>
        {CANCELLABLE.includes(o.status) && <Button onClick={onCancel}>Cancel order</Button>}
      </div>
    </Dialog>
  );
}

export default function Orders() {
  const toast = useToast();
  const [search, setSearch] = useUrlParam('search');
  const [status, setStatus] = useUrlParam('status');
  const [from, setFrom] = useUrlParam('from');
  const [to, setTo] = useUrlParam('to');
  const [typed, setTyped] = useState(search);
  const { data, error, reload, setPage } = usePagedList('/admin/orders', { search, status, from, to });
  const [open, setOpen] = useState(null);
  const [dialog, openDialog] = useActionDialog();

  // Search after a short pause in typing
  useEffect(() => {
    const t = setTimeout(() => typed.trim() !== search && setSearch(typed.trim()), 350);
    return () => clearTimeout(t);
  }, [typed]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to typing

  const cancel = (o) => {
    setOpen(null);
    const paid = o.status === 'RESERVED';
    openDialog({
      title: `Cancel order ${o.orderNo}?`,
      body: (
        <div className="grid gap-2">
          <p>{paid ? 'This order is paid, so a refund will be owed. It goes on the Refunds list; refund it by hand there.' : 'This order is not paid yet, so no refund is owed.'}</p>
          <p>The buyer is emailed that GbaanJo support cancelled it. Your reason is kept for the audit log and is not emailed.</p>
        </div>
      ),
      reasonLabel: 'Why are you cancelling this order?',
      confirmLabel: 'Cancel order',
      tone: 'danger',
      onConfirm: (reason) => api(`/admin/orders/${o.id}/cancel`, { method: 'POST', body: { reason } }),
      onDone: (r) => {
        toast(r?.refund ? 'Order cancelled. A refund is owed: it is on the Refunds list.' : 'Order cancelled. No refund is owed.');
        reload();
      },
    });
  };

  return (
    <div className="mt-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search" hint="Pickup code, order number, buyer email or business" className="sm:col-span-2">
          <Input type="search" inputMode="search" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {ORDER_STATUSES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </Select>
        </Field>
        <Field label="From (Lagos date)"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To (Lagos date)"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <ListState data={data} error={error} empty="No orders match." />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((o) => (
          <li key={o.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b>{o.orderNo}</b>
                <StatusBadge s={o.status} />
                {o.refundDue && <Pill tone="bg-pepper/10 text-pepper">Refund owed</Pill>}
              </div>
              <p className="[overflow-wrap:anywhere] text-sm text-mute">
                {o.buyer?.name} · {o.seller?.businessName} · {naira(o.amounts?.amountPaid ?? 0)}
              </p>
              {o.timeline?.[0] && <p className="text-sm text-mute">Placed {dateTimeLagos(o.timeline[0].at)}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpen(o)}>Details</Button>
          </li>
        ))}
      </ul>
      <Pager data={data} setPage={setPage} />
      {open && <OrderDetail o={open} onClose={() => setOpen(null)} onCancel={() => cancel(open)} />}
      {dialog}
    </div>
  );
}
