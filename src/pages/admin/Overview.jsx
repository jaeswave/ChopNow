import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { naira } from '../../components';
import { toLagosInput } from '../../components/time';
import { cx, tap } from '../../ui';
import { ErrorNote, Stat } from './kit';

// The six numbers that need attention. Each opens the matching screen with its filter set.
// problemOrders has no exact filter in the API: it opens paid orders that are not collected yet.
export function attentionCards(s, today = toLagosInput(Date.now()).slice(0, 10)) {
  return [
    ['pendingApps', 'Sellers waiting for approval', '/admin?tab=sellers&status=pending'],
    ['liveListings', 'Live listings', '/admin?tab=listings&status=ACTIVE'],
    ['ordersToday', 'Paid orders today', `/admin?tab=orders&from=${today}&to=${today}`],
    ['problemOrders', 'Problem orders (refund owed, or not collected after pickup time)', '/admin?tab=orders&status=RESERVED'],
    ['openFeedback', 'Open feedback', '/admin?tab=feedback&status=open'],
    ['suspended', 'Suspended users', '/admin?tab=users'],
  ].map(([key, label, to]) => ({ key, label, to, value: s?.[key] }));
}
const URGENT = ['pendingApps', 'problemOrders', 'openFeedback'];

export default function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api('/admin/overview').then(setS).catch(setError); }, []);
  if (error) return <ErrorNote error={error} className="mt-5" />;
  if (!s) return <div className="mt-5 h-32 animate-pulse rounded-2xl bg-line/70" />;
  return (
    <div className="mt-5 grid gap-6">
      <section aria-labelledby="attention-title">
        <h2 id="attention-title" className="text-lg font-extrabold">Needs attention</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {attentionCards(s).map((c) => (
            <li key={c.key}>
              <Link
                to={c.to}
                className={cx(tap, 'flex h-full min-w-0 flex-col justify-between gap-1 rounded-2xl [overflow-wrap:anywhere] bg-white p-4 ring-[1.5px] ring-line transition hover:ring-leaf focus-visible:outline-3 focus-visible:outline-palm')}
              >
                <span className="text-sm text-mute">{c.label}</span>
                <span className={cx('font-display text-2xl font-extrabold sm:text-3xl', URGENT.includes(c.key) && c.value > 0 && 'text-pepper')}>
                  {typeof c.value === 'number' ? c.value : '–'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="totals-title">
        <h2 id="totals-title" className="text-lg font-extrabold">Totals</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="GbaanJo fees earned" value={naira(s.fees ?? 0)} tone="text-leaf" />
          <Stat label="Total sales (paid)" value={naira(s.sales ?? 0)} />
          <Stat label="Refunds to process" value={s.refundsPending ?? 0} tone={s.refundsPending ? 'text-pepper' : ''} />
          <Stat label="Buyers" value={s.buyers ?? 0} />
          <Stat label="Sellers" value={s.sellers ?? 0} />
          <Stat label="Waitlist" value={s.waitlist ?? 0} />
          <Stat label="Picked up (all time)" value={s.pickedUp ?? 0} />
          <Stat label="No-shows (all time)" value={s.noShows ?? 0} tone={s.noShows ? 'text-pepper' : ''} />
        </div>
      </section>
    </div>
  );
}
