import { cx } from '../ui';

// Numbered steps. steps: [[title, text], ...]
export default function Steps({ steps, className = '' }) {
  return (
    <ol className={cx('grid gap-6', className)}>
      {steps.map(([title, text], i) => (
        <li key={title} className="relative pl-14">
          <span aria-hidden="true" className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-leaf font-display text-lg font-extrabold text-palm">
            {i + 1}
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-mute">{text}</p>
        </li>
      ))}
    </ol>
  );
}
