import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button, Field, Input, Spinner } from '../ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/auth/forgot-password', { method: 'POST', body: { email } }); setSent(true); }
    catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 ring-[1.5px] ring-line sm:p-8">
      {sent ? (
        <div className="grid gap-3 text-center">
          <div className="text-5xl">📬</div>
          <h1 className="text-3xl font-extrabold">Check your email</h1>
          <p className="text-mute">If there is a GbaanJo account for <b>{email}</b>, we have sent a link to choose a new password. It works for 1 hour. Check your spam folder too.</p>
          <Button as={Link} to="/auth" size="lg" className="mt-2">Back to log in</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <h1 className="text-3xl font-extrabold">Forgot your password?</h1>
          <p className="text-mute">Enter your email and we will send you a link to choose a new one.</p>
          <Field label="Email"><Input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {err && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{err}</p>}
          <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Send me the link'}</Button>
          <Link to="/auth" className="text-center text-sm font-semibold underline underline-offset-4">Back to log in</Link>
        </form>
      )}
    </div>
  );
}
