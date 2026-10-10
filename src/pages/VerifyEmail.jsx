import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button, useToast } from '../ui';

export default function VerifyEmail() {
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [state, setState] = useState('checking');
  const [msg, setMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) { setState('error'); setMsg('This link is missing its code. Open the link from your email again.'); return; }
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => { setState('ok'); if (localStorage.getItem('token')) refresh(); })
      .catch((e) => { setState('error'); setMsg(e.message); });
  }, []);

  const resend = async () => {
    try { await api('/auth/resend-verification', { method: 'POST' }); toast('A new link is on its way. Check your inbox and spam folder.'); } catch (e) { toast(e.message, 'err'); }
  };

  const view = { checking: ['⏳', 'Verifying your email…'], ok: ['✅', 'Email verified!'], error: ['⚠️', 'We could not verify your email'] }[state];
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center ring-[1.5px] ring-line">
      <div className="text-6xl">{view[0]}</div>
      <h1 className="mt-4 text-3xl font-extrabold">{view[1]}</h1>
      {state === 'ok' && <p className="mt-2 text-mute">{user?.role === 'SELLER' ? 'Next, we will review your CAC number. We will email you when your seller account is approved.' : 'You can now order food on GbaanJo.'}</p>}
      {state === 'error' && <p className="mt-2 text-mute">{msg}</p>}
      <div className="mt-6 grid gap-3">
        {state === 'ok' && <Button as={Link} to={user?.role === 'SELLER' ? '/seller' : '/#deals'} size="lg">{user?.role === 'SELLER' ? 'Go to my shop' : 'See live deals'}</Button>}
        {state === 'error' && (user ? <Button size="lg" onClick={resend}>Send me a new link</Button> : <Button as={Link} to="/auth" size="lg">Log in to get a new link</Button>)}
      </div>
    </div>
  );
}
