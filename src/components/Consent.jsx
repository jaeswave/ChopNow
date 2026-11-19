import { cx } from '../ui';

// The two legal pages. Privacy is section 5 of the Terms page for now. They open in a new tab so a form is not lost.
export const TERMS_URL = '/terms';
export const PRIVACY_URL = '/terms#privacy';
const link = 'font-semibold text-leaf underline underline-offset-4';

// "I agree to the Terms and the Privacy Policy". The whole row is the tap target (at least 44px).
export default function ConsentCheckbox({ checked, onChange, className = '' }) {
  return (
    <label className={cx('flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-2 text-sm hover:bg-paper', className)}>
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-6 shrink-0 cursor-pointer accent-leaf"
      />
      <span>
        I agree to the{' '}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={link}>Terms</a>{' '}
        and the{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={link}>Privacy Policy</a>
        <span className="sr-only"> (open in a new tab)</span>
      </span>
    </label>
  );
}
