import { api } from '../../api';
import { dateLagos } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { ListState, Pager, Pill, box, useActionDialog, usePagedList, useUrlParam } from './kit';

export const SELLER_STATUSES = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']];

// Seller approvals: GET /admin/sellers (paged), POST /admin/sellers/:id/approve and /reject (reason required)
export default function Sellers() {
  const toast = useToast();
  const [status, setStatus] = useUrlParam('status', 'pending');
  const { data, error, reload, setPage } = usePagedList('/admin/sellers', { status });
  const [dialog, openDialog] = useActionDialog();

  const approve = (u) =>
    openDialog({
      title: `Approve ${u.businessName}?`,
      body: <p>Only approve if you checked <b className="font-mono text-ink">{u.rcNumber}</b> on CAC's public search and the registered name matches. The seller gets an email.</p>,
      confirmLabel: 'Approve',
      onConfirm: () => api(`/admin/sellers/${u.id}/approve`, { method: 'POST' }),
      onDone: () => { toast('Seller approved and emailed'); reload(); },
    });
  const reject = (u) =>
    openDialog({
      title: `Reject ${u.businessName}?`,
      reasonLabel: 'Why are you rejecting this application?',
      reasonHint: 'The seller sees this in an email.',
      confirmLabel: 'Reject',
      tone: 'danger',
      onConfirm: (reason) => api(`/admin/sellers/${u.id}/reject`, { method: 'POST', body: { reason } }),
      onDone: () => { toast('Application rejected and emailed'); reload(); },
    });

  return (
    <div className="mt-5">
      <p className="rounded-xl bg-palm/25 p-4 text-sm"><b>How to check:</b> copy the CAC number, open CAC's public search, paste it in, and confirm the registered name matches the business name and the business is still active. Then approve or reject.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Application status">
        {SELLER_STATUSES.map(([v, t]) => <Chip key={v} on={status === v} aria-pressed={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}
      </div>
      <ListState data={data} error={error} empty="No applications here." />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((u) => (
          <li key={u.id} className={cx(box, 'grid gap-3')}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="break-words">{u.businessName}</b>
                {u.emailVerifiedAt ? <Pill tone="bg-leaf/10 text-leaf">Email verified</Pill> : <Pill tone="bg-pepper/10 text-pepper">Email not verified</Pill>}
              </div>
              <p className="text-sm text-mute">CAC number: <span className="font-mono text-ink">{u.rcNumber}</span></p>
              <p className="break-words text-sm text-mute">{u.name} · {u.email} · {u.phone} · applied {dateLagos(u.createdAt)}</p>
              {u.rejectionReason && <p className="text-sm text-pepper">Rejected: {u.rejectionReason}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as="a" size="sm" variant="outline" href="https://search.cac.gov.ng/home" target="_blank" rel="noreferrer">CAC search</Button>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(u.rcNumber).then(() => toast('Number copied'))}>Copy number</Button>
              {u.approvalStatus !== 'APPROVED' && <Button size="sm" variant="leaf" onClick={() => approve(u)}>Approve</Button>}
              {u.approvalStatus === 'PENDING' && <Button size="sm" variant="outline" onClick={() => reject(u)}>Reject</Button>}
            </div>
          </li>
        ))}
      </ul>
      <Pager data={data} setPage={setPage} />
      {dialog}
    </div>
  );
}
