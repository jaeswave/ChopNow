import { cx } from '../../ui';

// Applied → Email verified → Approved, so a seller waiting for approval always knows where they are.
// No review times are promised here.
const LOOK = {
  done: { mark: '✓', circle: 'bg-leaf text-white', text: 'Done' },
  current: { mark: '…', circle: 'bg-palm text-[#2a1d00]', text: 'In progress' },
  problem: { mark: '!', circle: 'bg-pepper text-white', text: 'Needs changes' },
  next: { mark: '', circle: 'bg-paper ring-[1.5px] ring-line', text: 'Not yet' },
};

export function timelineSteps(user) {
  const verified = !!user.emailVerified;
  const rejected = user.approvalStatus === 'REJECTED';
  return [
    { label: 'Applied', state: 'done' },
    { label: 'Email verified', state: verified ? 'done' : 'current' },
    { label: 'Approved', state: rejected ? 'problem' : verified ? 'current' : 'next' },
  ];
}

export default function ApplicationTimeline({ user }) {
  const steps = timelineSteps(user);
  return (
    <ol aria-label="Your application" className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-4 ring-[1.5px] ring-line">
      {steps.map((s, i) => {
        const look = LOOK[s.state];
        return (
          <li key={s.label} className="grid justify-items-center gap-1.5 text-center">
            <span aria-hidden="true" className={cx('grid size-9 place-items-center rounded-full text-sm font-bold', look.circle)}>
              {look.mark || i + 1}
            </span>
            <span className="text-sm font-semibold">{s.label}</span>
            <span className={cx('text-xs', s.state === 'problem' ? 'font-semibold text-pepper' : 'text-mute')}>{look.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
