import { Button, Spinner, cx } from '../../ui';

// "Finish setting up" card. steps: [{ label, hint, done, action: { label, onClick, busy } }]
// The page hides it once every step is done.
export default function SetupChecklist({ steps }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <section aria-labelledby="setup-title" className="mt-6 rounded-2xl bg-white p-5 ring-2 ring-palm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="setup-title" className="text-xl font-extrabold">Finish setting up</h2>
        <p className="text-sm font-semibold text-mute">{done} of {steps.length} done</p>
      </div>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${steps.length} done`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 grid gap-4">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className={cx(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                s.done ? 'bg-leaf text-white' : 'bg-paper text-ink ring-[1.5px] ring-line',
              )}
            >
              {s.done ? '✓' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cx('font-semibold', s.done && 'text-mute')}>
                {s.label}
                <span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span>
              </p>
              {!s.done && <p className="text-sm text-mute">{s.hint}</p>}
            </div>
            {!s.done && s.action && (
              <Button size="sm" variant="leaf" className="min-h-11" disabled={s.action.busy} onClick={s.action.onClick}>
                {s.action.busy ? <Spinner /> : s.action.label}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
