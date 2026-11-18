import { cx, tap } from '../ui';

// Questions that open on tap. items: [[question, answer], ...]
export default function Faq({ items, className = '' }) {
  return (
    <div className={cx('grid gap-3', className)}>
      {items.map(([q, a]) => (
        <details key={q} className="group rounded-xl bg-white px-4 py-2 ring-[1.5px] ring-line transition open:ring-leaf">
          <summary className={cx(tap, 'flex cursor-pointer list-none items-center justify-between gap-4 py-2 font-bold focus-visible:outline-3 focus-visible:outline-palm [&::-webkit-details-marker]:hidden')}>
            {q}
            <span aria-hidden="true" className="text-leaf transition group-open:rotate-180">▾</span>
          </summary>
          <p className="pb-2 text-mute">{a}</p>
        </details>
      ))}
    </div>
  );
}
