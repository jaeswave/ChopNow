import { useState } from 'react';
import { api } from '../api';
import { toLagosInput } from './time';
import { Button, Spinner } from '../ui';

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
