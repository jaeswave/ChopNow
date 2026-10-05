import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ---------- Button ---------- */
const btnBase = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-palm disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[.98]';
const variants = {
  primary: 'bg-pepper text-white shadow-lg shadow-pepper/25 hover:brightness-110',
  palm: 'bg-palm text-[#2a1d00] shadow-lg shadow-palm/30 hover:brightness-105',
  leaf: 'bg-leaf text-white hover:bg-leaf-2',
  ghost: 'bg-transparent text-white ring-2 ring-white/40 hover:bg-white/10',
  outline: 'bg-white text-ink ring-[1.5px] ring-line hover:ring-leaf',
  link: 'text-ink underline underline-offset-4 hover:text-pepper',
};
const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3', lg: 'px-8 py-4 text-lg' };
export function Button({ as: As = 'button', variant = 'primary', size = 'md', className = '', ...p }) {
  return <As className={cx(btnBase, variants[variant], variant !== 'link' && sizes[size], className)} {...p} />;
}

/* ---------- Form fields ---------- */
const field = 'rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-ink outline-none transition placeholder:text-mute/70 focus:border-leaf focus:ring-4 focus:ring-palm/40';
const width = (c) => (/\bw-/.test(c) ? '' : 'w-full');
export const Input = ({ className = '', ...p }) => <input className={cx(field, width(className), className)} {...p} />;
export const Select = ({ className = '', children, ...p }) => <select className={cx(field, width(className), 'cursor-pointer', className)} {...p}>{children}</select>;
export const Textarea = ({ className = '', ...p }) => <textarea className={cx(field, width(className), 'min-h-24', className)} {...p} />;
export const Field = ({ label, hint, children, className = '' }) => (
  <label className={cx('grid gap-1.5 text-sm font-semibold', className)}>
    {label}{children}{hint && <span className="font-normal text-mute">{hint}</span>}
  </label>
);

export const Chip = ({ on, className = '', ...p }) => (
  <button type="button" className={cx('cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-[1.5px] transition focus-visible:outline-3 focus-visible:outline-palm', on ? 'bg-leaf text-white ring-leaf' : 'bg-white text-ink ring-line hover:ring-leaf', className)} {...p} />
);

export const Container = ({ className = '', ...p }) => <div className={cx('mx-auto w-full max-w-6xl px-5 sm:px-8', className)} {...p} />;

/* ---------- Scroll reveal ---------- */
export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: delay + 'ms' }} className={cx('motion-safe:transition motion-safe:duration-700', seen ? 'translate-y-0 opacity-100' : 'motion-safe:translate-y-6 motion-safe:opacity-0', className)}>
      {children}
    </div>
  );
}

/* ---------- Toast ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef();
  const show = (msg, type = 'ok') => { setT({ msg, type }); clearTimeout(timer.current); timer.current = setTimeout(() => setT(null), 3800); };
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && <div role="status" className={cx('fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl px-5 py-3.5 text-center font-semibold shadow-2xl', t.type === 'err' ? 'bg-pepper text-white' : 'bg-leaf text-white')}>{t.msg}</div>}
    </ToastCtx.Provider>
  );
}

export const Spinner = () => <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
