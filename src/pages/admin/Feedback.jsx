import { useEffect, useState } from 'react';
import { api } from '../../api';
import { dateTimeLagos } from '../../components';
import { Button, Chip, cx, useToast } from '../../ui';
import { Pill, box } from './kit';

export default function Feedback() {
  const toast = useToast();
  const [status, setStatus] = useState('NEW');
  const [items, setItems] = useState(null);
  const load = () => api('/admin/feedback' + (status ? '?status=' + status : '')).then(setItems).catch((e) => toast(e.message, 'err'));
  useEffect(() => { setItems(null); load(); }, [status]);
  const mark = async (id, st) => { try { await api('/admin/feedback/' + id, { method: 'PATCH', body: { status: st } }); load(); } catch (e) { toast(e.message, 'err'); } };
  const kind = { BUG: ['🐞', 'bg-pepper/10 text-pepper'], IDEA: ['💡', 'bg-palm/30 text-ink'], PRAISE: ['💚', 'bg-leaf/10 text-leaf'], GENERAL: ['💬', 'bg-paper text-ink'] };
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">{[['NEW', 'New'], ['SEEN', 'Seen'], ['DONE', 'Done'], ['', 'All']].map(([v, t]) => <Chip key={v} on={status === v} onClick={() => setStatus(v)}>{t}</Chip>)}</div>
      {items && items.length === 0 && <p className="mt-6 text-mute">Nothing here.</p>}
      <ul className="mt-4 grid gap-3">
        {items?.map((f) => (
          <li key={f.id} className={cx(box, 'grid gap-2')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={kind[f.category]?.[1]}>{kind[f.category]?.[0]} {f.category}</Pill>
              {f.rating && <span title={`${f.rating} out of 5`}>{'⭐'.repeat(f.rating)}</span>}
              <span className="text-sm text-mute">{dateTimeLagos(f.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap">{f.message}</p>
            <p className="text-sm text-mute">{f.user ? `${f.user.name} (${f.user.role}) · ${f.user.email}` : [f.name, f.email].filter(Boolean).join(' · ') || 'Anonymous'}{f.page ? ` · from ${f.page}` : ''}</p>
            <div className="flex gap-2">
              {f.status !== 'SEEN' && f.status !== 'DONE' && <Button size="sm" variant="outline" onClick={() => mark(f.id, 'SEEN')}>Mark seen</Button>}
              {f.status !== 'DONE' && <Button size="sm" onClick={() => mark(f.id, 'DONE')}>Done</Button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
