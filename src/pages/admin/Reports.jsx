import { Link } from 'react-router-dom';
import { api } from '../../api';
import { dateTimeLagos } from '../../components';
import { reasonLabel } from '../../components/Report';
import { Button, Chip, cx, tapText, useToast } from '../../ui';
import { ListState, Pager, Pill, box, useActionDialog, usePagedList, useUrlParam } from './kit';

export const REPORT_FILTERS = [['open', 'Open'], ['done', 'Done']];

// Reports from users: GET /admin/reports (paged, newest first), POST /admin/reports/:id/resolve with a required note.
// Only admins ever see who reported.
export default function Reports() {
  const toast = useToast();
  const [status, setStatus] = useUrlParam('status', 'open');
  const { data, error, reload, setPage } = usePagedList('/admin/reports', { status });
  const [dialog, openDialog] = useActionDialog();

  const resolve = (r) =>
    openDialog({
      title: 'Resolve this report?',
      body: <p>Resolving does not unhide a listing. Use Listings to unhide it if needed.</p>,
      reasonLabel: 'What did you find or do?',
      reasonHint: 'Kept for the admin team; not sent to anyone.',
      confirmLabel: 'Resolve',
      onConfirm: (note) => api(`/admin/reports/${r.id}/resolve`, { method: 'POST', body: { note } }),
      onDone: () => { toast('Report resolved'); reload(); },
    });

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Report status">
        {REPORT_FILTERS.map(([v, t]) => <Chip key={v} on={status === v} aria-pressed={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}
      </div>
      <ListState data={data} error={error} empty={status === 'open' ? 'No open reports.' : 'No resolved reports yet.'} />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((r) => (
          <li key={r.id} className={cx(box, 'grid gap-2')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{r.targetType === 'listing' ? 'Listing' : 'User'}</Pill>
              <b className="[overflow-wrap:anywhere]">{r.target?.name || 'Removed or deleted'}</b>
              {r.target?.hidden && <Pill tone="bg-pepper text-white">Hidden</Pill>}
              {r.target?.suspended && <Pill tone="bg-pepper text-white">Suspended</Pill>}
              {r.openReportsOnTarget > 1 && <Pill tone="bg-palm/40 text-ink">{r.openReportsOnTarget} open reports on this</Pill>}
            </div>
            {r.target?.businessName && <p className="[overflow-wrap:anywhere] text-sm text-mute">{r.target.businessName}</p>}
            <p className="font-semibold">{reasonLabel(r.reason)}</p>
            {r.note && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">“{r.note}”</p>}
            <p className="[overflow-wrap:anywhere] text-sm text-mute">
              Reported by {r.reporter?.name || 'unknown'}{r.reporter?.email ? ` (${r.reporter.email})` : ''} · {dateTimeLagos(r.createdAt)}
            </p>
            {r.status === 'DONE' ? (
              <p className="[overflow-wrap:anywhere] rounded-xl bg-leaf/5 p-3 text-sm">
                <b>Resolved</b>{r.resolvedBy?.name ? ` by ${r.resolvedBy.name}` : ''}{r.resolvedAt ? ` · ${dateTimeLagos(r.resolvedAt)}` : ''}
                {r.resolutionNote && <><br />{r.resolutionNote}</>}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => resolve(r)}>Resolve</Button>
                {r.targetType === 'user' && r.target?.name && (
                  <Link to={`/admin?tab=users&q=${encodeURIComponent(r.target.name)}`} className={cx(tapText, 'text-sm font-semibold text-leaf underline underline-offset-4')}>
                    Open in Users
                  </Link>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Pager data={data} setPage={setPage} />
      {dialog}
    </div>
  );
}
