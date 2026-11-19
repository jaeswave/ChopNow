import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { dateLagos } from '../../components';
import { Button, Chip, Input, cx, useToast } from '../../ui';
import { ErrorNote, ListState, Pill, box, useActionDialog, useUrlParam } from './kit';

export const USER_ROLES = [['', 'Everyone'], ['SELLER', 'Sellers'], ['BUYER', 'Buyers'], ['ADMIN', 'Admins']];

// Users: search, verify sellers, reset no-shows, and suspend/unsuspend with a required reason (POST routes).
// Admins cannot be suspended: the server refuses and its message shows in the dialog.
export default function Users() {
  const toast = useToast();
  const [role, setRole] = useUrlParam('role');
  const [q, setQ] = useUrlParam('q');
  const [typed, setTyped] = useState(q);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [dialog, openDialog] = useActionDialog();

  const load = useCallback(() => {
    setError(null);
    return api(`/admin/users?role=${role}&q=${encodeURIComponent(q)}`)
      .then((rows) => setData({ items: Array.isArray(rows) ? rows : rows.items || [] }))
      .catch((e) => { setError(e); setData({ items: [] }); });
  }, [role, q]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => typed.trim() !== q && setQ(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to typing

  const patch = async (path, body, msg) => {
    setRowError(null);
    try { await api(path, { method: 'PATCH', body }); toast(msg); load(); } catch (e) { setRowError(e); }
  };
  const suspend = (u) =>
    openDialog({
      title: `Suspend ${u.businessName || u.name}?`,
      body: (
        <p>
          They cannot log in, order or list. {u.role === 'SELLER' ? 'Their live listings and open orders are cancelled; paid orders go on the Refunds list.' : 'Their open orders are cancelled; paid orders go on the Refunds list.'} Unsuspending does not bring those back.
        </p>
      ),
      reasonLabel: 'Why are you suspending this account?',
      confirmLabel: 'Suspend',
      tone: 'danger',
      onConfirm: (reason) => api(`/admin/users/${u.id}/suspend`, { method: 'POST', body: { reason } }),
      onDone: () => { toast('Account suspended'); load(); },
    });
  const unsuspend = (u) =>
    openDialog({
      title: `Restore ${u.businessName || u.name}?`,
      body: <p>They can log in again. Cancelled orders and listings stay cancelled.</p>,
      reasonLabel: 'Why are you restoring this account?',
      confirmLabel: 'Restore account',
      onConfirm: (reason) => api(`/admin/users/${u.id}/unsuspend`, { method: 'POST', body: { reason } }),
      onDone: () => { toast('Account restored'); load(); },
    });

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Role">
          {USER_ROLES.map(([v, t]) => <Chip key={v} on={role === v} aria-pressed={role === v} onClick={() => setRole(v)}>{t}</Chip>)}
        </div>
        <Input type="search" aria-label="Search users" className="min-w-0 flex-1 basis-56" placeholder="Search name, email or business…" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </div>
      <ErrorNote error={rowError} className="mt-4" />
      <ListState data={data} error={error} empty="No users found." />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((u) => (
          <li key={u.id} className={cx(box, 'grid gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="break-words">{u.businessName || u.name}</b><Pill>{u.role}</Pill>
                {u.verified && <Pill tone="bg-leaf/10 text-leaf">Verified</Pill>}
                {u.suspended && <Pill tone="bg-pepper text-white">Suspended</Pill>}
              </div>
              <p className="break-words text-sm text-mute">{u.name} · {u.email} · {u.phone}{u.city ? ` · ${u.city}` : ''}</p>
              <p className="text-sm text-mute">No-shows: {u.noShows ?? 0} · Joined {dateLagos(u.createdAt)}{u.role === 'SELLER' ? ` · Payout: ${u.accountName ? `${u.accountName} (${u.bankName})` : 'not set up'}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.role === 'SELLER' && <Button size="sm" variant="outline" onClick={() => patch(`/admin/users/${u.id}/verify`, { value: !u.verified }, u.verified ? 'Verification removed' : 'Seller verified')}>{u.verified ? 'Unverify' : 'Verify'}</Button>}
              {u.noShows > 0 && <Button size="sm" variant="outline" onClick={() => patch(`/admin/users/${u.id}/reset-noshows`, undefined, 'No-shows reset')}>Reset no-shows</Button>}
              {u.suspended ? (
                <Button size="sm" variant="leaf" onClick={() => unsuspend(u)}>Restore</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => suspend(u)}>Suspend</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {dialog}
    </div>
  );
}
