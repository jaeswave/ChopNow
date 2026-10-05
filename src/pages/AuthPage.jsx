import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button, Field, Input, Spinner, cx } from '../ui';

const ROLES = [['BUYER', '🛍️', 'I want to buy', 'Grab deals near me'], ['SELLER', '🍳', 'I want to sell', 'List my surplus food']];

export default function AuthPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ role: 'BUYER', name: '', email: '', phone: '', password: '', businessName: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (user) nav(user.role === 'SELLER' ? '/seller' : '/', { replace: true }); }, [user]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body = mode === 'login' ? { email: f.email, password: f.password } : { ...f, businessName: f.role === 'SELLER' ? f.businessName : undefined };
      login(await api('/auth/' + mode, { method: 'POST', body }));
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-leaf/10 ring-[1.5px] ring-line lg:grid-cols-[.9fr_1.1fr]">
      <div className="hidden bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Good food, last call.</h2>
          <p className="mt-3 text-white/80">Join ChopNow to buy at least 30% off, or to turn surplus into cash.</p>
        </div>
        <ul className="grid gap-4">
          {[['🔔', 'See deals ending soon near you'], ['🔒', 'Addresses stay private until you reserve'], ['🧾', 'Pay at pickup. Nothing to pay online']].map(([e, t]) => <li key={t} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10 text-xl">{e}</span>{t}</li>)}
        </ul>
        <div className="text-7xl">🍛🍞🍅</div>
      </div>

      <form onSubmit={submit} className="grid content-start gap-4 p-6 sm:p-10">
        <div>
          <h1 className="text-3xl font-extrabold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-mute">{mode === 'login' ? 'Log in to reserve deals or manage your shop.' : 'It takes less than a minute.'}</p>
        </div>

        {mode === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(([r, e, t, d]) => (
                <button key={r} type="button" onClick={() => setF({ ...f, role: r })} className={cx('cursor-pointer rounded-2xl p-4 text-left ring-[1.5px] transition', f.role === r ? 'bg-leaf/5 ring-2 ring-leaf' : 'ring-line hover:ring-leaf')}>
                  <span className="text-2xl">{e}</span><b className="mt-1 block">{t}</b><span className="text-sm text-mute">{d}</span>
                </button>
              ))}
            </div>
            <Field label="Full name"><Input required placeholder="e.g. Chidinma Okafor" value={f.name} onChange={set('name')} /></Field>
            <Field label="Phone number" hint="Nigerian number, e.g. 08012345678"><Input required inputMode="tel" placeholder="08012345678" value={f.phone} onChange={set('phone')} /></Field>
            {f.role === 'SELLER' && <Field label="Business name"><Input required placeholder="e.g. Mama Tee Kitchen" value={f.businessName} onChange={set('businessName')} /></Field>}
          </>
        )}

        <Field label="Email"><Input required type="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password">
          <div className="relative">
            <Input required type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className="pr-16" value={f.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-sm font-bold text-leaf">{show ? 'Hide' : 'Show'}</button>
          </div>
        </Field>

        {err && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{err}</p>}
        <Button size="lg" disabled={busy}>{busy ? <Spinner /> : mode === 'login' ? 'Log in' : 'Create account'}</Button>
        <button type="button" className="cursor-pointer text-sm font-semibold underline underline-offset-4" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
