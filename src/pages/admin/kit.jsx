import { cx } from '../../ui';

// Small pieces shared by the admin screens
export const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line';
export const Stat = ({ label, value, tone = '' }) => (
  <div className={cx(box, 'p-4')}><p className="text-sm text-mute">{label}</p><p className={cx('font-display text-3xl font-extrabold', tone)}>{value}</p></div>
);
export const Pill = ({ children, tone = 'bg-paper text-ink' }) => <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', tone)}>{children}</span>;
