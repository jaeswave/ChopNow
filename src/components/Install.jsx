import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSavedCity } from '../hooks/useCity';
import { canPromptInstall, isIOS, isPhone, isStandalone, onInstallChange, promptInstall } from '../pwa';
import { Button, cx, tap } from '../ui';

const SEEN_KEY = 'gj_install_card_at';
export const INSTALL_CARD_GAP_DAYS = 14;
const DELAY_MS = 4000; // a few seconds after load, so it never fights with the page for attention
const HIDDEN_ON = /^\/(pay|verify-email|reset-password)/;

// The whole rule in one place, so it is easy to test.
export function shouldShowInstallCard({ now, lastShown, citySaved, standalone, phone, canPrompt, ios }) {
  if (standalone || !phone || !citySaved) return false;
  if (!canPrompt && !ios) return false; // nothing we can offer on this browser
  if (lastShown && now - lastShown < INSTALL_CARD_GAP_DAYS * 864e5) return false;
  return true;
}

const readSeen = () => {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
};
const markSeen = () => {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* private mode */ }
};

// The live install situation on this device
export function useInstallState() {
  const [, rerender] = useState(0);
  useEffect(() => onInstallChange(() => rerender((n) => n + 1)), []);
  return { canPrompt: canPromptInstall(), ios: isIOS(), standalone: isStandalone() };
}

function IOSSteps() {
  return (
    <p className="text-sm">
      Tap <b>Share</b> <span aria-hidden="true">(the square with an arrow)</span>, then <b>Add to Home Screen</b>.
    </p>
  );
}

/* A small card near the bottom of the screen, at most once every 14 days, on phones only */
export default function InstallCard() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const { canPrompt } = useInstallState();

  useEffect(() => {
    let timer;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const ok = shouldShowInstallCard({
          now: Date.now(), lastShown: readSeen(), citySaved: !!getSavedCity(),
          standalone: isStandalone(), phone: isPhone(), canPrompt: canPromptInstall(), ios: isIOS(),
        });
        if (ok) { markSeen(); setShow(true); }
      }, DELAY_MS);
    };
    check();
    const off = onInstallChange(check);
    window.addEventListener('gj:city-saved', check);
    return () => { clearTimeout(timer); off(); window.removeEventListener('gj:city-saved', check); };
  }, []);

  if (!show || HIDDEN_ON.test(pathname)) return null;
  const close = () => setShow(false);
  const install = async () => { await promptInstall(); close(); };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-title"
      className="fixed inset-x-3 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] z-40 rounded-2xl bg-white p-4 text-ink shadow-2xl shadow-black/25 ring-[1.5px] ring-line md:hidden"
    >
      <div className="flex gap-3">
        <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 id="install-title" className="font-bold">Add GbaanJo to your home screen</h2>
          {canPrompt ? <p className="text-sm text-mute">Open deals in one tap, full screen, like an app.</p> : <IOSSteps />}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={close}>Not now</Button>
        {canPrompt && <Button size="sm" onClick={install}>Install</Button>}
      </div>
    </div>
  );
}

/* The "Add to home screen" row on the Account page. Always available, whatever the 14-day card did. */
export function InstallRow() {
  const { canPrompt, ios, standalone } = useInstallState();
  const [showSteps, setShowSteps] = useState(false);
  let action = null;
  let note = 'Open this site in Chrome on Android or Safari on iPhone to add it to your home screen.';
  if (standalone) note = 'GbaanJo is on your home screen. You are using the app.';
  else if (canPrompt) {
    note = 'Open deals in one tap, full screen, like an app.';
    action = <Button size="sm" onClick={() => promptInstall()}>Install</Button>;
  } else if (ios) {
    note = null;
    action = <Button size="sm" variant="outline" aria-expanded={showSteps} onClick={() => setShowSteps(!showSteps)}>How?</Button>;
  }
  return (
    <div className={cx('flex flex-wrap items-center gap-3', tap)}>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-palm/30 text-lg">📲</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Add to home screen {standalone && <span className="text-leaf">✓</span>}</p>
        {note && <p className="text-sm text-mute">{note}</p>}
        {ios && !standalone && showSteps && <IOSSteps />}
      </div>
      {action}
    </div>
  );
}
