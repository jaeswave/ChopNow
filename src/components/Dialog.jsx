import { useEffect, useId, useRef } from 'react';

// A touch-friendly dialog instead of the browser's confirm()/prompt(): a sheet at the bottom on phones,
// centred on wider screens. Escape or a tap outside closes it, and focus goes back where it was.
export function Dialog({ title, onClose, children }) {
  const id = useId();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // always the latest, without re-running the effect below
  useEffect(() => {
    const before = document.activeElement;
    // Start in the reason box if there is one; otherwise on the dialog itself, so it opens at the top and no
    // button (such as 'Cancel order') is chosen by default
    (ref.current?.querySelector('textarea, input, select') || ref.current)?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && closeRef.current()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className="max-h-[90vh] outline-none w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <h2 id={id} className="text-xl font-extrabold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

