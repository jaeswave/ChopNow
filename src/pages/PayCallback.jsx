import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button } from '../ui';

// Paystack sends the buyer back here. We ask our own server (which asks Paystack) whether the payment really went through.
export default function PayCallback() {
  const [sp] = useSearchParams();
  const ref = sp.get('reference') || sp.get('trxref');
  const [state, setState] = useState('checking');

  useEffect(() => {
    if (!ref) { setState('failed'); return; }
    let tries = 0, stop = false;
    const run = async () => {
      try {
        const r = await api('/orders/verify/' + ref);
        if (['RESERVED', 'PICKED_UP'].includes(r.status)) { if (!stop) setState('paid'); return; }
        if (r.refundDue) { if (!stop) setState('refund'); return; }
      } catch { /* try again */ }
      if (++tries < 6 && !stop) setTimeout(run, 2000); else if (!stop) setState('failed');
    };
    run();
    return () => { stop = true; };
  }, [ref]);

  const view = {
    checking: ['⏳', 'Confirming your payment…', 'Please wait a moment. Do not close this page.'],
    paid: ['✅', 'Payment received!', 'Your food is reserved. Your pickup code and the seller\'s address are in My orders.'],
    refund: ['↩️', 'Your payment arrived too late', 'The hold on this food had already expired, so your money will be refunded. You will see it in My orders.'],
    failed: ['⚠️', 'We could not confirm your payment yet', 'If money left your account, it will show up in My orders shortly or be refunded. If you did not complete the payment, you can try again from My orders while the hold lasts.'],
  }[state];

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center ring-[1.5px] ring-line">
      <div className="text-6xl">{view[0]}</div>
      <h1 className="mt-4 text-3xl font-extrabold">{view[1]}</h1>
      <p className="mt-2 text-mute">{view[2]}</p>
      {state !== 'checking' && <Button as={Link} to="/orders" size="lg" className="mt-6">Go to My orders</Button>}
    </div>
  );
}
