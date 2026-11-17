import { useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Field, Input, Spinner, useToast } from '../ui';

const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line sm:p-7';

// onSaved(): called after the payout account is saved, so the page around it can update straight away
export default function Payouts({ onSaved }) {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [bankName, setBankName] = useState('');
  const [acctName, setAcctName] = useState('');
  const [acct, setAcct] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => api('/payouts/me').then(setMe).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/payouts/setup', { method: 'POST', body: { bankName, accountName: acctName, accountNumber: acct, password } });
      toast('Payout account saved. You can now publish listings.');
      setPassword(''); setAcct(''); setBankName(''); setAcctName(''); setEditing(false); load();
      onSaved?.();
    } catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  if (!me) return <div className="mt-5 h-40 animate-pulse rounded-2xl bg-line/70" />;
  const showForm = !me.hasPayout || editing;
  const ready = bankName.trim().length > 1 && acctName.trim().length > 1 && acct.length === 10;

  return (
    <div className="mt-5 grid max-w-xl gap-4">
      {me.hasPayout && (
        <div className={box}>
          <p className="text-sm text-mute">Your earnings are paid to</p>
          <p className="mt-1 text-xl font-bold">{me.accountName}</p>
          <p className="text-mute">{me.bankName} · account ending {me.last4}</p>
          {!editing && <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditing(true)}>Change account</Button>}
        </div>
      )}
      {showForm && (
        <form onSubmit={save} className={box + ' grid gap-4'}>
          <div>
            <h2 className="text-2xl font-extrabold">{me.hasPayout ? 'Change payout account' : 'Where should we send your money?'}</h2>
            <p className="mt-1 text-sm text-mute">
              After you hand an order over, we pay your share to this account. We send money exactly as written here, so please check every detail.
            </p>
          </div>
          <Field label="Bank name"><Input required placeholder="e.g. GTBank, Access Bank, Kuda" value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
          <Field label="Account number"><Input required inputMode="numeric" maxLength={10} placeholder="10-digit account number" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Name on the account" hint="Exactly as your bank shows it"><Input required value={acctName} onChange={(e) => setAcctName(e.target.value)} /></Field>
          <Field label="Your GbaanJo password" hint="We ask again because this controls where your money goes."><Input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <div className="flex gap-3">
            <Button size="lg" disabled={busy || !ready}>{busy ? <Spinner /> : 'Save payout account'}</Button>
            {editing && <Button type="button" variant="outline" size="lg" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </form>
      )}
    </div>
  );
}
