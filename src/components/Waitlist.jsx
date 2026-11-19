import { useState } from 'react';
import { api } from '../api';
import { useMeta } from '../hooks/useMeta';
import { Button, Field, Input, Select, Spinner, cx } from '../ui';

export const WAITLIST_THANKS = 'You are on the list. We will email you the day we open. Tell a friend who loves a good deal.';

// The cities to offer: the live ones first (Lagos), then the server's coming-soon list (which may end with "Other")
export const waitlistCities = (meta) => {
  const live = meta?.cities?.length ? meta.cities : ['Lagos'];
  return [...new Set([...live, ...(meta?.comingSoon || [])])];
};

// Waitlist sign-up (POST /waitlist { email, city }). The first live city (Lagos) is chosen by default.
export default function Waitlist({ className = '', tone = 'light' }) {
  const meta = useMeta();
  const cities = waitlistCities(meta);
  const [email, setEmail] = useState('');
  const [picked, setPicked] = useState(null); // null: the default, the first live city
  const city = picked ?? cities[0];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const join = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/waitlist', { method: 'POST', body: { email: email.trim(), city } });
      setDone(true);
    } catch (err) {
      setError(err);
    }
    setBusy(false);
  };

  const card = cx('rounded-2xl bg-white p-5 text-ink ring-[1.5px] ring-line sm:p-6', tone === 'dark' && 'shadow-2xl shadow-black/25 ring-0', className);
  if (done) {
    return (
      <div role="status" className={card}>
        <p className="text-lg font-bold text-leaf">✓ {WAITLIST_THANKS}</p>
      </div>
    );
  }
  const message = error && (error.status === 429 && !error.code ? 'Please wait a minute, then try again.' : error.messages?.length > 1 ? error.messages.join('. ') : error.message);
  return (
    <form onSubmit={join} className={cx(card, 'grid gap-3')} aria-labelledby="waitlist-title">
      <h2 id="waitlist-title" className="text-xl font-extrabold">Join the waitlist</h2>
      <Field label="Your email">
        <Input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Your city">
        <Select value={city} onChange={(e) => setPicked(e.target.value)}>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      {message && <p role="alert" className="rounded-xl bg-pepper/10 p-3 text-sm font-medium text-pepper">{message}</p>}
      <Button type="submit" size="lg" disabled={busy || !email.trim() || !city}>{busy ? <Spinner /> : 'Join the waitlist'}</Button>
    </form>
  );
}
