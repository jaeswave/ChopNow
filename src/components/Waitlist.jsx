import { useState } from 'react';
import { api } from '../api';
import { useMeta } from '../hooks/useMeta';
import { Button, Field, Input, Select, Spinner, cx } from '../ui';

const OTHER = '__other';
export const WAITLIST_THANKS = 'You are on the list. We will email you the day we open. Tell a friend who loves a good deal.';

// Waitlist sign-up (POST /waitlist { email, city }). Lagos is chosen by default; "Another city" asks for its name.
export default function Waitlist({ className = '', tone = 'light' }) {
  const live = useMeta()?.cities?.[0] || 'Lagos';
  const [email, setEmail] = useState('');
  const [choice, setChoice] = useState(live);
  const [other, setOther] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const city = choice === OTHER ? other.trim() : choice;

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
        <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value={live}>{live}</option>
          <option value={OTHER}>Another city</option>
        </Select>
      </Field>
      {choice === OTHER && (
        <Field label="Which city?">
          <Input required minLength={2} maxLength={40} value={other} onChange={(e) => setOther(e.target.value)} />
        </Field>
      )}
      {message && <p role="alert" className="rounded-xl bg-pepper/10 p-3 text-sm font-medium text-pepper">{message}</p>}
      <Button type="submit" size="lg" disabled={busy || !email.trim() || city.length < 2}>{busy ? <Spinner /> : 'Join the waitlist'}</Button>
    </form>
  );
}
