import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useMeta } from '../hooks/useMeta';
import { getSavedCity, guessCityFromGPS, guessCityFromIP, saveCity } from '../hooks/useCity';
import { Button, Field, Input, Select, Spinner, useToast } from '../ui';

// Asks every new visitor (once per device) which city they are in. We make a guess from their location to save them a tap,
// but we never decide for them. Anyone outside the cities we are live in can leave an email for the waitlist.
export default function CityConfirm() {
  const { user, ready, refresh } = useAuth();
  const { cities, comingSoon } = useMeta();
  const { pathname } = useLocation();
  const toast = useToast();
  const live = cities?.[0] || 'Lagos';
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('ask'); // ask | elsewhere | thanks
  const [guess, setGuess] = useState(null); // 'yes' | 'no' | null
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [other, setOther] = useState('');

  useEffect(() => {
    if (!ready || getSavedCity()) return;
    setOpen(true);
    guessCityFromIP().then((g) => g && setGuess(g.inLagos ? 'yes' : 'no'));
  }, [ready]);

  // Never interrupt a payment or an email link
  if (!open || /^\/(pay|verify-email|reset-password)/.test(pathname)) return null;

  const confirm = async () => {
    saveCity(live);
    setOpen(false);
    if (user) { try { await api('/auth/city', { method: 'PATCH', body: { city: live } }); refresh(); } catch { /* not important */ } }
  };
  const useGps = async () => {
    setBusy(true);
    const g = await guessCityFromGPS();
    setBusy(false);
    if (!g) return toast('We could not read your location. Please choose below.', 'err');
    if (g.inLagos) confirm(); else setStep('elsewhere');
  };
  const join = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api('/waitlist', { method: 'POST', body: { email, city: other || 'Other' } }); saveCity('elsewhere'); setStep('thanks'); }
    catch (err) { toast(err.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="city-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {step === 'ask' && (
          <>
            <div className="text-4xl">📍</div>
            <h2 id="city-title" className="mt-2 text-2xl font-extrabold">Are you in {live}?</h2>
            <p className="mt-1 text-mute">
              {guess === 'yes' ? `It looks like you are in ${live}. Please confirm. ` : guess === 'no' ? 'You may be outside our area. Please tell us where you are. ' : ''}
              GbaanJo is live in {live} only for now, so we only show deals you can actually collect.
            </p>
            <div className="mt-5 grid gap-2">
              <Button size="lg" onClick={confirm}>Yes, I am in {live}</Button>
              <Button size="lg" variant="outline" disabled={busy} onClick={useGps}>{busy ? <Spinner /> : 'Check using my phone location'}</Button>
              <button className="mt-1 cursor-pointer text-sm font-semibold underline underline-offset-4" onClick={() => setStep('elsewhere')}>I am somewhere else</button>
            </div>
          </>
        )}
        {step === 'elsewhere' && (
          <form onSubmit={join} className="grid gap-3">
            <div className="text-4xl">🚧</div>
            <h2 id="city-title" className="text-2xl font-extrabold">We are not there yet</h2>
            <p className="text-mute">We are starting in {live} and will open new cities soon. Leave your email and we will tell you the day we reach you.</p>
            <Field label="Your city"><Select value={other} onChange={(e) => setOther(e.target.value)}><option value="">Choose…</option>{(comingSoon || []).map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Email"><Input required type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button size="lg" disabled={busy}>{busy ? <Spinner /> : 'Tell me when you arrive'}</Button>
            <button type="button" className="cursor-pointer text-sm font-semibold underline underline-offset-4" onClick={() => setStep('ask')}>Actually, I am in {live}</button>
          </form>
        )}
        {step === 'thanks' && (
          <div className="grid gap-3 text-center">
            <div className="text-5xl">💚</div>
            <h2 id="city-title" className="text-2xl font-extrabold">Thank you!</h2>
            <p className="text-mute">We will email you when GbaanJo opens in your city. You are welcome to look around in the meantime.</p>
            <Button size="lg" onClick={() => setOpen(false)}>Look around</Button>
          </div>
        )}
      </div>
    </div>
  );
}
