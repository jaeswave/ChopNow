import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button, Chip, Field, Input, Spinner, Textarea, cx } from '../ui';

const KINDS = [['BUG', '🐞', 'Something broke'], ['IDEA', '💡', 'I have an idea'], ['PRAISE', '💚', 'I liked something'], ['GENERAL', '💬', 'Something else']];

// Feedback for the pilot. Works for visitors too, so testers who have not signed up can still tell us what they think.
export default function Feedback() {
  const { user } = useAuth();
  const [kind, setKind] = useState('GENERAL');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/feedback', { method: 'POST', body: { category: kind, rating: rating || undefined, message, name: name || undefined, email: email || undefined, page: document.referrer ? new URL(document.referrer).pathname : undefined } });
      setDone(true);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  if (done) return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center ring-[1.5px] ring-line">
      <div className="text-6xl">🙏</div><h1 className="mt-3 text-3xl font-extrabold">Thank you!</h1>
      <p className="mt-2 text-mute">Every message is read by a real person. It helps us fix and improve GbaanJo.</p>
      <Button as={Link} to="/deals" size="lg" className="mt-6">Back to live deals</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-xl gap-4 rounded-3xl bg-white p-6 ring-[1.5px] ring-line sm:p-8">
      <div>
        <h1 className="text-3xl font-extrabold">Help us make GbaanJo better</h1>
        <p className="mt-1 text-mute">We are testing with a small group in Lagos. Tell us what worked, what confused you, or what broke.</p>
      </div>
      <div className="flex flex-wrap gap-2">{KINDS.map(([k, e, t]) => <Chip key={k} type="button" on={kind === k} onClick={() => setKind(k)}>{e} {t}</Chip>)}</div>
      <Field label="How was your experience? (optional)">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} out of 5`} onClick={() => setRating(rating === n ? 0 : n)} className={cx('size-11 cursor-pointer rounded-xl text-2xl transition', n <= rating ? 'bg-palm/40' : 'bg-paper grayscale hover:grayscale-0')}>⭐</button>
          ))}
        </div>
      </Field>
      <Field label="Your message" hint="What were you trying to do? What happened?"><Textarea required minLength={5} maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type here…" /></Field>
      {!user && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name (optional)"><Input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email (optional)" hint="Only if you want a reply"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </div>
      )}
      {err && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{err}</p>}
      <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Send feedback'}</Button>
    </form>
  );
}
