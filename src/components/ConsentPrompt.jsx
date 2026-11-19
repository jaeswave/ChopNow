import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useMeta } from '../hooks/useMeta';
import { Button, Spinner } from '../ui';
import ConsentCheckbox from './Consent';

// Pages where the prompt never covers the screen: admin work, reading the Terms themselves,
// and one-off links (payment return, email verification, password reset) that must finish first.
const NOT_ON = /^\/(admin|terms|pay|verify-email|reset-password)(\/|$)/;

export const shouldAskConsent = (user, legal, pathname) => !!(user?.consentRequired && legal && !NOT_ON.test(pathname));

// Full-screen "please accept the updated Terms" for logged-in users with consentRequired.
// Only when the server sends 'legal' (release safety). The user can accept or log out.
export default function ConsentPrompt() {
  const { user, logout, updateUser } = useAuth();
  const legal = useMeta()?.legal; // null until a server with consent support answers
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef(null);
  const show = shouldAskConsent(user, legal, pathname);
  useEffect(() => { if (show) heading.current?.focus(); }, [show]);
  if (!show) return null;

  const accept = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setBusy(true);
    setError('');
    try {
      const fresh = await api('/me/consent', { method: 'POST', body: { termsVersion: legal.termsVersion, privacyVersion: legal.privacyVersion } });
      updateUser(fresh?.id ? fresh : { ...user, consentRequired: false });
    } catch (err) {
      if (err.code === 'CONSENT_REQUIRED') setAgreed(false);
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <form
        onSubmit={accept}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="mx-auto grid w-full max-w-md gap-4 rounded-3xl bg-white p-5 ring-[1.5px] ring-line sm:p-8"
      >
        <p className="font-display text-2xl font-extrabold text-leaf">Gbaan<span className="text-palm">Jo</span></p>
        <h1 id="consent-title" ref={heading} tabIndex={-1} className="text-2xl font-extrabold outline-none">Please accept the updated Terms</h1>
        <p className="text-mute">Before you carry on, please read the Terms and the Privacy Policy, then tick the box.</p>
        <ConsentCheckbox checked={agreed} onChange={setAgreed} />
        {error && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{error}</p>}
        <Button type="submit" size="lg" disabled={busy || !agreed}>{busy ? <Spinner /> : 'Continue'}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            logout();
            nav('/');
          }}
        >
          Log out
        </Button>
      </form>
    </div>
  );
}
