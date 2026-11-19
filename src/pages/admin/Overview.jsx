import { useEffect, useState } from 'react';
import { api } from '../../api';
import { naira } from '../../components';
import { useToast } from '../../ui';
import { Stat } from './kit';

export default function Overview() {
  const [s, setS] = useState(null);
  const toast = useToast();
  useEffect(() => { api('/admin/overview').then(setS).catch((e) => toast(e.message, 'err')); }, []);
  if (!s) return <div className="mt-5 h-32 animate-pulse rounded-2xl bg-line/70" />;
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="GbaanJo fees earned" value={naira(s.fees)} tone="text-leaf" /><Stat label="Total sales (paid)" value={naira(s.sales)} />
      <Stat label="Refunds to process" value={s.refundsPending} tone={s.refundsPending ? 'text-pepper' : ''} /><Stat label="Orders paid today" value={s.ordersToday} />
      <Stat label="Buyers" value={s.buyers} /><Stat label="Sellers" value={s.sellers} />
      <Stat label="New feedback" value={s.feedbackNew} tone={s.feedbackNew ? 'text-leaf' : ''} /><Stat label="Waitlist (outside Lagos)" value={s.waitlist} /><Stat label="Live listings" value={s.activeListings} /><Stat label="Suspended accounts" value={s.suspended} tone={s.suspended ? 'text-pepper' : ''} />
      <Stat label="Picked up (all time)" value={s.pickedUp} /><Stat label="No-shows (all time)" value={s.noShows} tone={s.noShows ? 'text-pepper' : ''} />
    </div>
  );
}
