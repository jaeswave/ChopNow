import { dateTimeLagos } from '../../components';
import { cx } from '../../ui';
import { ListState, Pager, Pill, box, usePagedList } from './kit';

// Plain-English names for the actions in the contract (docs/ADMIN-API.md, Audit log)
export const ACTIONS = {
  'seller.approve': 'Approved seller',
  'seller.reject': 'Rejected seller',
  'user.suspend': 'Suspended user',
  'user.unsuspend': 'Restored user',
  'user.verify': 'Verified seller',
  'user.unverify': 'Removed verification',
  'user.reset_noshows': 'Reset no-shows',
  'listing.hide': 'Hid listing',
  'listing.unhide': 'Unhid listing',
  'listing.remove': 'Removed listing',
  'order.cancel': 'Cancelled order',
  'feedback.resolve': 'Resolved feedback',
  'report.resolve': 'Resolved a report',
  'listing.auto_hide': 'Listing hidden automatically after several reports',
  'user.anonymise': 'Anonymised account',
  'user.export': 'User downloaded their data',
  'user.delete': 'User deleted their account',
  'user.delete_requested': 'User asked to delete their account',
  'feedback.status_new': 'Marked feedback new',
  'feedback.status_seen': 'Marked feedback seen',
  'feedback.status_done': 'Marked feedback done',
};

// Audit log: GET /admin/audit (paged, newest first). Read-only.
export default function Audit() {
  const { data, error, setPage } = usePagedList('/admin/audit', {});
  return (
    <div className="mt-5">
      <p className="text-sm text-mute">Every successful admin action, newest first. Times are Lagos time.</p>
      <ListState data={data} error={error} empty="No admin actions yet." />
      <ol className="mt-4 grid gap-3">
        {data?.items.map((a) => (
          <li key={a.id} className={cx(box, 'grid gap-1 p-4')}>
            <div className="flex flex-wrap items-center gap-2">
              <b>{ACTIONS[a.action] || a.action}</b>
              <Pill>{a.targetType}</Pill>
              <span className="text-sm text-mute">{dateTimeLagos(a.createdAt)}</span>
            </div>
            <p className="[overflow-wrap:anywhere] text-sm text-mute">
              By {a.admin?.name || 'unknown'}{a.admin?.email ? ` (${a.admin.email})` : ''} · {a.targetType} <span className="font-mono">{a.targetId}</span>
            </p>
            {a.reason && <p className="[overflow-wrap:anywhere] text-sm">Reason: {a.reason}</p>}
          </li>
        ))}
      </ol>
      <Pager data={data} setPage={setPage} />
    </div>
  );
}
