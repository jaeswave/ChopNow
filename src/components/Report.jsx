import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Dialog } from './Dialog';
import { Button, Field, Spinner, Textarea, cx } from '../ui';

// The fixed reason codes (docs/SAFETY-API.md) with the wording we show
export const REPORT_REASONS = [
  ['UNSAFE_FOOD', 'The food looked or tasted unsafe'],
  ['NOT_AS_DESCRIBED', 'It was not what the listing said'],
  ['SELLER_ABSENT', 'The seller was closed or not there at pickup time'],
  ['FAKE_DISCOUNT', 'The price or discount looks fake'],
  ['PAY_OUTSIDE', 'I was asked to pay outside GbaanJo'],
  ['RUDE_OR_UNSAFE', 'Rude, threatening or unsafe behaviour'],
  ['OTHER', 'Something else'],
];
export const reasonLabel = (code) => REPORT_REASONS.find(([c]) => c === code)?.[1] || code;
export const NOTE_MAX = 300;

export const reportErrorText = (err) => err?.message || 'Something went wrong. Please try again.';

function ReportForm({ targetType, targetId, onClose }) {
  const name = useId();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      const body = { targetType, targetId, reason };
      if (note.trim()) body.note = note.trim();
      await api('/reports', { method: 'POST', body });
      setSent(true);
    } catch (err) {
      setError(err);
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <div className="mt-3 grid gap-4">
        <p role="status" className="rounded-xl bg-leaf/10 p-4 font-semibold text-leaf">Thanks, we will look into it.</p>
        <div className="flex justify-end">
          <Button data-close onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }
  const already = false;
  return (
    <form onSubmit={send} className="mt-3 grid gap-4">
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-semibold">What is wrong?</legend>
        {REPORT_REASONS.map(([code, label]) => (
          <label key={code} className={cx('flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ring-[1.5px] transition', reason === code ? 'bg-leaf/5 ring-leaf' : 'ring-line hover:ring-leaf')}>
            <input type="radio" name={name} value={code} checked={reason === code} onChange={() => setReason(code)} className="size-5 shrink-0 accent-leaf" />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <Field label="Anything else we should know? (optional)" hint={`${note.length}/${NOTE_MAX} characters`}>
        <Textarea maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className={cx('rounded-xl p-3 text-sm font-medium', already ? 'bg-palm/25 text-ink' : 'bg-pepper/10 text-pepper')}>
          {error.messages?.length > 1 ? error.messages.join(' ') : reportErrorText(error)}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" data-close variant="outline" onClick={onClose} disabled={busy}>{already ? 'Close' : 'Cancel'}</Button>
        {!already && <Button type="submit" disabled={busy || !reason}>{busy ? <Spinner /> : 'Send report'}</Button>}
      </div>
    </form>
  );
}

// "Report" button + dialog. targetType "listing" or "user". Logged-out visitors are asked to log in and come back.
export default function ReportButton({ targetType, targetId, label = 'Report', title, className = '' }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  if (!targetId) return null;
  const back = encodeURIComponent(pathname + search);
  return (
    <>
      <Button variant="link" size="sm" className={cx('text-mute', className)} onClick={() => setOpen(true)}>
        <span aria-hidden="true">⚑</span> {label}
      </Button>
      {open && (
        <Dialog title={title || (targetType === 'user' ? 'Report this seller' : 'Report this listing')} onClose={() => setOpen(false)}>
          {user ? (
            <ReportForm targetType={targetType} targetId={targetId} onClose={() => setOpen(false)} />
          ) : (
            <div className="mt-3 grid gap-4">
              <p className="text-mute">Please log in to send a report. We will bring you back here.</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button data-close variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button as={Link} to={`/auth?next=${back}`}>Log in</Button>
              </div>
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
