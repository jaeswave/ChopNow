import { useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Field, Input, Select, Spinner, useToast } from '../ui';

const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line sm:p-7';

export default function Payouts() {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [acct, setAcct] = useState('');
  const [name, setName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => api('/payouts/me').then(setMe).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); api('/payouts/banks').then(setBanks).catch((e) => toast(e.message, 'err')); }, []);

  // Look up the account name as soon as the bank and 10 digits are filled in, so sellers can catch typos
  useEffect(() => {
    setName('');
    if (acct.length !== 10 || !bankCode) return;
    setResolving(true);
    api(`/payouts/resolve?account_number=${acct}&bank_code=${bankCode}`).then((r) => setName(r.accountName)).catch((e) => toast(e.message, 'err')).finally(() => setResolving(false));
  }, [acct, bankCode]);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/payouts/setup', { method: 'POST', body: { bankCode, accountNumber: acct, password } });
      toast('Payout account saved. You can now publish listings.');
      setPassword(''); setAcct(''); setEditing(false); load();
    } catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  if (!me) return <div className="mt-5 h-40 animate-pulse rounded-2xl bg-line/70" />;
  const showForm = !me.hasPayout || editing;

  return (
    <div className="mt-5 grid max-w-xl gap-4">
      {me.hasPayout && (
        <div className={box}>
          <p className="text-sm text-mute">Your sales are paid to</p>
          <p className="mt-1 text-xl font-bold">{me.accountName}</p>
          <p className="text-mute">{me.bankName} · account ending {me.last4}</p>
          {!editing && <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditing(true)}>Change account</Button>}
        </div>
      )}
      {showForm && (
        <form onSubmit={save} className={box + ' grid gap-4'}>
          <div>
            <h2 className="text-2xl font-extrabold">{me.hasPayout ? 'Change payout account' : 'Where should we send your money?'}</h2>
            <p className="mt-1 text-sm text-mute">When a buyer pays, Paystack sends your share straight to this account, usually the next business day. GbaanJo's fee is taken automatically.</p>
          </div>
          <Field label="Bank"><Select required value={bankCode} onChange={(e) => setBankCode(e.target.value)}><option value="">Choose your bank…</option>{banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</Select></Field>
          <Field label="Account number"><Input required inputMode="numeric" maxLength={10} placeholder="10-digit account number" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} /></Field>
          {resolving && <p className="flex items-center gap-2 text-sm text-mute"><Spinner /> Checking account…</p>}
          {name && <p className="rounded-xl bg-leaf/10 p-3 font-semibold text-leaf">✓ {name}</p>}
          <Field label="Your GbaanJo password" hint="We ask again because this controls where your money goes."><Input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <div className="flex gap-3">
            <Button size="lg" disabled={busy || !name}>{busy ? <Spinner /> : 'Save payout account'}</Button>
            {editing && <Button type="button" variant="outline" size="lg" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </form>
      )}
    </div>
  );
}
