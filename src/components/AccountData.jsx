import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Dialog } from './Dialog';
import { toLagosInput } from './time';
import { Button, Field, Input, Spinner, useToast } from '../ui';

// gbaanjo-my-data-2026-11-19.json (the Lagos date)
export const exportFileName = (now = Date.now()) => `gbaanjo-my-data-${toLagosInput(now).slice(0, 10)}.json`;

// Offer data as a .json file to save
export function saveJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// "Download my data": GET /me/export (sent with the login), saved as a file
export function DownloadData() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const download = async () => {
    setBusy(true);
    setError('');
    setDone(false);
    try {
      saveJson(await api('/me/export'), exportFileName());
      setDone(true);
    } catch (err) {
      setError(`We could not prepare your data. ${err.message}`);
    }
    setBusy(false);
  };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Download my data</p>
          <p className="text-sm text-mute">A file with your profile, orders and everything else we hold about you.</p>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={download}>{busy ? <Spinner /> : 'Download'}</Button>
      </div>
      {done && <p role="status" className="text-sm font-semibold text-leaf">✓ Your file has been downloaded.</p>}
      {error && <p role="alert" className="rounded-xl bg-pepper/10 p-3 text-sm font-medium text-pepper">{error}</p>}
    </div>
  );
}

/* ---------- Delete my account ---------- */

// Plain sentences for the stable blocker codes from POST /me/delete (409 DELETION_BLOCKED)
export const BLOCKER_TEXT = {
  UNPAID_ORDER: 'You have an order waiting for payment. Pay for it or cancel it first.',
  UNCOLLECTED_ORDER: 'You have a paid order that has not been collected yet.',
  REFUND_PENDING: 'We still owe you a refund. We will send it to you first.',
  LIVE_LISTING: 'You have a listing that is still on sale. Cancel it from My shop first.',
  OPEN_SALES: 'Customers still have unpaid or uncollected orders from you.',
  PAYOUT_PENDING: 'We still owe you a payout for your sales. We will pay it first.',
};
export const blockerText = (b) => BLOCKER_TEXT[b?.code] || b?.message || 'Something on your account is still open.';

function DeleteDialog({ onClose }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blockers, setBlockers] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    setBlockers(null);
    try {
      await api('/me/delete', { method: 'POST', body: { password } });
      logout(); // every old login now gets 401 anyway
      nav('/');
      toast('Your account has been deleted. We sent a confirmation to your old email address.');
    } catch (err) {
      // Never log out here: a wrong password (400) or open orders (409) leave the account as it is
      if (err.code === 'DELETION_BLOCKED') setBlockers(err.blockers || []);
      else setError(err.message);
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <Dialog title="Delete your account?" onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit} className="mt-3 grid gap-4">
        <ul className="grid list-disc gap-1 pl-5 text-mute">
          <li>Your name, email, phone number and business details are removed, and you are logged out everywhere.</li>
          <li>Your orders and payment records stay in our records for accounting, without your name.</li>
          <li><b className="text-ink">This cannot be undone.</b></li>
        </ul>
        {blockers ? (
          <div role="alert" className="grid gap-2 rounded-xl bg-palm/25 p-4">
            <p className="font-semibold">We cannot delete your account yet, because:</p>
            <ul className="grid list-disc gap-1 pl-5">
              {(blockers.length ? blockers : [{}]).map((b, i) => <li key={b.code || i}>{blockerText(b)}</li>)}
            </ul>
            <p>We have recorded your request. An admin will finish deleting your account once these are closed.</p>
          </div>
        ) : (
          <>
            <Field label="Your password" hint="To make sure it is you.">
              <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p role="alert" className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper">{error}</p>}
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" data-close variant="outline" disabled={busy} onClick={onClose}>{blockers ? 'Close' : 'Cancel'}</Button>
          {!blockers && <Button type="submit" disabled={busy || !password}>{busy ? <Spinner /> : 'Delete my account'}</Button>}
        </div>
      </form>
    </Dialog>
  );
}

// "Delete my account" row. Not for admin accounts (the server refuses them too).
export function DeleteAccount() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user || user.role === 'ADMIN') return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Delete my account</p>
        <p className="text-sm text-mute">Remove your personal details from GbaanJo for good.</p>
      </div>
      <Button size="sm" variant="outline" className="text-pepper" onClick={() => setOpen(true)}>Delete</Button>
      {open && <DeleteDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
