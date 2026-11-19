import { api } from '../../api';
import { dateTimeLagos } from '../../components';
import { Button, cx, useToast } from '../../ui';
import { ListState, Pager, Pill, box, useActionDialog, usePagedList } from './kit';

// Account deletion requests: GET /admin/deletion-requests (paged, oldest first) and POST /admin/users/:id/anonymise.
// Admins see the blocker CODES; the user-worded messages are for the user.
export default function Deletions() {
  const toast = useToast();
  const { data, error, reload, setPage } = usePagedList('/admin/deletion-requests', {});
  const [dialog, openDialog] = useActionDialog();

  const anonymise = (u) =>
    openDialog({
      title: `Anonymise ${u.name || 'this account'}?`,
      body: (
        <div className="grid gap-2">
          <p>This removes their name, email, phone, business and payout details, and logs them out everywhere. Their orders and payments stay, without their details. A confirmation goes to their old email address.</p>
          <p><b className="text-ink">This cannot be undone.</b></p>
        </div>
      ),
      confirmLabel: 'Anonymise',
      tone: 'danger',
      onConfirm: () => api(`/admin/users/${u.id}/anonymise`, { method: 'POST' }),
      onDone: () => { toast('Account anonymised'); reload(); },
    });

  return (
    <div className="mt-5">
      <p className="text-sm text-mute">People who asked to delete their account while something was still open. Oldest first. Anonymise once nothing is left open.</p>
      <ListState data={data} error={error} empty="No deletion requests." />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((u) => (
          <li key={u.id} className={cx(box, 'grid gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="[overflow-wrap:anywhere]">{u.businessName || u.name}</b>
                <Pill>{u.role}</Pill>
              </div>
              <p className="[overflow-wrap:anywhere] text-sm text-mute">{u.name} · {u.email}{u.businessName ? ` · ${u.businessName}` : ''}</p>
              <p className="text-sm text-mute">Asked {dateTimeLagos(u.deletionRequestedAt)}</p>
              {u.blockers?.length ? (
                <ul aria-label="Still open" className="mt-2 flex flex-wrap gap-1.5">
                  {u.blockers.map((b) => <li key={b.code} className="rounded-full bg-palm/30 px-2.5 py-0.5 font-mono text-xs">{b.code}</li>)}
                </ul>
              ) : (
                <p className="mt-1 text-sm font-semibold text-leaf">Nothing open: this can be finished now.</p>
              )}
            </div>
            <div>
              <Button size="sm" variant="outline" className="text-pepper" onClick={() => anonymise(u)}>Anonymise</Button>
            </div>
          </li>
        ))}
      </ul>
      <Pager data={data} setPage={setPage} />
      {dialog}
    </div>
  );
}
