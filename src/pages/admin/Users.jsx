import { useEffect, useState } from 'react';
import { api } from '../../api';
import { dateLagos } from '../../components';
import { Button, Chip, Input, cx, useToast } from '../../ui';
import { Pill, box } from './kit';

export default function Users() {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(null);
  const load = () => api(`/admin/users?role=${role}&q=${encodeURIComponent(q)}`).then(setUsers).catch((e) => toast(e.message, 'err'));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [role, q]);

  const act = async (path, body, msg, ask) => {
    if (ask && !window.confirm(ask)) return;
    try { await api(path, { method: 'PATCH', body }); toast(msg); load(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">{[['', 'Everyone'], ['SELLER', 'Sellers'], ['BUYER', 'Buyers']].map(([v, t]) => <Chip key={v} on={role === v} onClick={() => setRole(v)}>{t}</Chip>)}</div>
        <Input aria-label="Search users" className="min-w-56 flex-1" placeholder="Search name, email or business…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {users && users.length === 0 && <p className="mt-6 text-mute">No users found.</p>}
      <ul className="mt-4 grid gap-3">
        {users?.map((u) => (
          <li key={u.id} className={cx(box, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b>{u.businessName || u.name}</b><Pill>{u.role}</Pill>
                {u.verified && <Pill tone="bg-leaf/10 text-leaf">Verified</Pill>}
                {u.suspended && <Pill tone="bg-pepper/10 text-pepper">Suspended</Pill>}
              </div>
              <p className="text-sm text-mute">{u.name} · {u.email} · {u.phone} · {u.city}</p>
              <p className="text-sm text-mute">No-shows: {u.noShows} · Joined {dateLagos(u.createdAt)}{u.role === 'SELLER' ? ` · Payout: ${u.accountName ? `${u.accountName} (${u.bankName})` : 'not set up'}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.role === 'SELLER' && <Button size="sm" variant="outline" onClick={() => act(`/admin/users/${u.id}/verify`, { value: !u.verified }, u.verified ? 'Verification removed' : 'Seller verified')}>{u.verified ? 'Unverify' : 'Verify'}</Button>}
              {u.noShows > 0 && <Button size="sm" variant="outline" onClick={() => act(`/admin/users/${u.id}/reset-noshows`, undefined, 'No-shows reset')}>Reset no-shows</Button>}
              <Button size="sm" variant={u.suspended ? 'leaf' : 'outline'} onClick={() => act(`/admin/users/${u.id}/suspend`, { value: !u.suspended }, u.suspended ? 'Account restored' : 'Account suspended', !u.suspended && 'Suspend this account? Live listings and open orders will be cancelled, and paid orders will be queued for refund.')}>{u.suspended ? 'Restore' : 'Suspend'}</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
