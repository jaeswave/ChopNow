import { useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Field, Input, Select, Spinner, useToast } from '../ui';

const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line sm:p-7';

export default function Payouts() {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [manual, setManual] = useState(null); // true = the seller types their own bank details
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [acctName, setAcctName] = useState('');
  const [acct, setAcct] = useState('');
  const [name, setName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => api('/payouts/me').then(setMe).catch((e) => toast(e.message, 'err'));
  useEffect(() => {
    load();
    api('/payouts/mode').then((m) => {
      setManual(m.manual);
      if (!m.manual) api('/payouts/banks').then(setBanks).catch((e) => toast(e.message, 'err'));
    }).catch((e) => toast(e.message, 'err'));
  }, []);

  // Automatic mode only: look up the account name once the bank and 10 digits are filled in, so sellers can catch typos
  useEffect(() => {
    setName('');
    if (manual !== false || acct.length !== 10 || !bankCode) return;
    setResolving(true);
    api(`/payouts/resolve?account_number=${acct}&bank_code=${bankCode}`).then((r) => setName(r.accountName)).catch((e) => toast(e.message, 'err')).finally(() => setResolving(false));
  }, [acct, bankCode, manual]);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = manual ? { bankName, accountName: acctName, accountNumber: acct, password } : { bankCode, accountNumber: acct, password };
      await api('/payouts/setup', { method: 'POST', body });
      toast('Payout account saved. You can now publish listings.');
      setPassword(''); setAcct(''); setBankName(''); setAcctName(''); setEditing(false); load();
    } catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  if (!me || manual === null) return <div className="mt-5 h-40 animate-pulse rounded-2xl bg-line/70" />;
  const showForm = !me.hasPayout || editing;
  const ready = manual ? bankName.trim().length > 1 && acctName.trim().length > 1 && acct.length === 10 : !!name;

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
              {manual
                ? 'After you hand an order over, we pay your share to this account. We send money exactly as written here, so please check every detail.'
                : 'When a buyer pays, your share is sent to this account. GbaanJo\'s fee is taken automatically.'}
            </p>
          </div>
          {manual ? (
            <Field label="Bank name"><Input required placeholder="e.g. GTBank, Access Bank, Kuda" value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
          ) : (
            <Field label="Bank"><Select required value={bankCode} onChange={(e) => setBankCode(e.target.value)}><option value="">Choose your bank…</option>{banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</Select></Field>
          )}
          <Field label="Account number"><Input required inputMode="numeric" maxLength={10} placeholder="10-digit account number" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} /></Field>
          {manual
            ? <Field label="Name on the account" hint="Exactly as your bank shows it"><Input required value={acctName} onChange={(e) => setAcctName(e.target.value)} /></Field>
            : <>
                {resolving && <p className="flex items-center gap-2 text-sm text-mute"><Spinner /> Checking account…</p>}
                {name && <p className="rounded-xl bg-leaf/10 p-3 font-semibold text-leaf">✓ {name}</p>}
              </>}
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
