import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button, Field, Input, Spinner } from '../ui';

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/auth/reset-password', { method: 'POST', body: { token, password } }); setDone(true); }
    catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  if (!token) return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center ring-[1.5px] ring-line">
      <div className="text-5xl">⚠️</div><h1 className="mt-3 text-3xl font-extrabold">This link is incomplete</h1>
      <p className="mt-2 text-mute">Open the link from your email again, or ask for a new one.</p>
      <Button as={Link} to="/forgot-password" size="lg" className="mt-5">Get a new link</Button>
    </div>
  );
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 ring-[1.5px] ring-line sm:p-8">
      {done ? (
        <div className="grid gap-3 text-center">
          <div className="text-5xl">✅</div><h1 className="text-3xl font-extrabold">Password changed</h1>
          <p className="text-mute">You can now log in with your new password.</p>
          <Button as={Link} to="/auth" size="lg" className="mt-2">Log in</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <h1 className="text-3xl font-extrabold">Choose a new password</h1>
          <Field label="New password" hint="At least 8 characters">
            <div className="relative">
              <Input required minLength={8} maxLength={72} type={show ? 'text' : 'password'} autoComplete="new-password" className="pr-16" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-sm font-bold text-leaf">{show ? 'Hide' : 'Show'}</button>
            </div>
          </Field>
          {err && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{err}</p>}
          <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Save new password'}</Button>
          {err && <Link to="/forgot-password" className="text-center text-sm font-semibold underline underline-offset-4">Get a new link</Link>}
        </form>
      )}
    </div>
  );
}
