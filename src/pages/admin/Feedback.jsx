import { api } from '../../api';
import { dateTimeLagos } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { ListState, Pager, Pill, box, useActionDialog, usePagedList, useUrlParam } from './kit';

export const FEEDBACK_FILTERS = [['open', 'Open'], ['done', 'Done'], ['', 'All']];
const KIND = { BUG: ['🐞', 'bg-pepper/10 text-pepper'], IDEA: ['💡', 'bg-palm/30 text-ink'], PRAISE: ['💚', 'bg-leaf/10 text-leaf'], GENERAL: ['💬', 'bg-paper text-ink'] };

// Feedback inbox: GET /admin/feedback?status=open|done (paged), POST /admin/feedback/:id/resolve
export default function Feedback() {
  const toast = useToast();
  const [status, setStatus] = useUrlParam('status', 'open');
  const { data, error, reload, setPage } = usePagedList('/admin/feedback', { status });
  const [dialog, openDialog] = useActionDialog();

  const resolve = (f) =>
    openDialog({
      title: 'Mark this feedback as done?',
      body: <p className="line-clamp-3 whitespace-pre-wrap">{f.message}</p>,
      confirmLabel: 'Resolve',
      onConfirm: () => api(`/admin/feedback/${f.id}/resolve`, { method: 'POST' }),
      onDone: () => { toast('Feedback resolved'); reload(); },
    });

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Feedback status">
        {FEEDBACK_FILTERS.map(([v, t]) => <Chip key={v} on={status === v} aria-pressed={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}
      </div>
      <ListState data={data} error={error} empty="No feedback here." />
      <ul className="mt-4 grid gap-3">
        {data?.items.map((f) => (
          <li key={f.id} className={cx(box, 'grid gap-2')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={KIND[f.category]?.[1]}>{KIND[f.category]?.[0]} {f.category}</Pill>
              {f.rating ? <span title={`${f.rating} out of 5`} aria-label={`${f.rating} out of 5`}>{'⭐'.repeat(f.rating)}</span> : null}
              {f.status === 'DONE' && <Pill tone="bg-leaf/10 text-leaf">Done</Pill>}
              <span className="text-sm text-mute">{dateTimeLagos(f.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap break-words">{f.message}</p>
            <p className="break-words text-sm text-mute">
              {f.user ? `${f.user.name} (${f.user.role}) · ${f.user.email}` : [f.name, f.email].filter(Boolean).join(' · ') || 'Anonymous'}
              {f.page ? ` · from ${f.page}` : ''}
            </p>
            {f.status !== 'DONE' && (
              <div>
                <Button size="sm" onClick={() => resolve(f)}>Resolve</Button>
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
