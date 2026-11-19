import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { Button, Field, Spinner, Textarea, cx } from '../../ui';

// Small pieces shared by the admin screens
export const box = 'rounded-2xl bg-white p-5 ring-[1.5px] ring-line';
// Long emails, ids and big numbers wrap instead of pushing the page sideways on small phones
export const Stat = ({ label, value, tone = '' }) => (
  <div className={cx(box, 'min-w-0 p-4')}><p className="text-sm text-mute">{label}</p><p className={cx('font-display text-2xl font-extrabold [overflow-wrap:anywhere] sm:text-3xl', tone)}>{value}</p></div>
);
export const Pill = ({ children, tone = 'bg-paper text-ink' }) => <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', tone)}>{children}</span>;

/* ---------- Errors ---------- */
// Shows an error from api(). A 400 with a list of messages shows each one.
export function ErrorNote({ error, className = '' }) {
  if (!error) return null;
  const list = error.messages?.length > 1 ? error.messages : null;
  const text = error.status === 404 && error.notFoundHint ? error.notFoundHint : error.message;
  return (
    <div role="alert" className={cx('rounded-xl bg-pepper/10 p-3 text-sm font-medium text-pepper', className)}>
      {list ? <ul className="list-disc pl-5">{list.map((m) => <li key={m}>{m}</li>)}</ul> : text}
    </div>
  );
}

/* ---------- Dialog ---------- */
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

export const REASON_MAX = 300; // the server accepts 1 to 300 characters, not blank
export const reasonOk = (r) => r.trim().length > 0 && r.trim().length <= REASON_MAX;

// Confirm an action, optionally with a required reason. onConfirm(reason) may throw: the error shows in the dialog.
// onDone(result) runs after success. tone="danger" makes the confirm button red.
export function ActionDialog({ title, body, confirmLabel, reasonLabel, reasonHint, tone, onConfirm, onDone, onClose }) {
  const needsReason = !!reasonLabel;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ready = !busy && (!needsReason || reasonOk(reason));
  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onConfirm(needsReason ? reason.trim() : undefined);
      onDone?.(result);
      onClose();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };
  return (
    <Dialog title={title} onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit} className="mt-3 grid gap-4">
        {body && <div className="text-mute">{body}</div>}
        {needsReason && (
          <Field label={reasonLabel} hint={`${reasonHint ? reasonHint + ' ' : ''}Required. ${reason.trim().length}/${REASON_MAX} characters.`}>
            <Textarea required maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        <ErrorNote error={error} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" data-close variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant={tone === 'danger' ? 'primary' : 'leaf'} disabled={!ready}>{busy ? <Spinner /> : confirmLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}

// const [dialog, open] = useActionDialog(); open({ title, confirmLabel, ... }); then render {dialog}
export function useActionDialog() {
  const [props, setProps] = useState(null);
  const close = useCallback(() => setProps(null), []);
  return [props && <ActionDialog {...props} onClose={close} />, setProps];
}

/* ---------- Filters in the URL ---------- */
// const [status, setStatus] = useUrlParam('status', 'pending'). Changing a filter goes back to page 1.
export function useUrlParam(name, fallback = '') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const set = (v) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (v === '' || v === null || v === undefined) next.delete(name);
        else next.set(name, v);
        if (name !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );
  return [value, set];
}

/* ---------- Paged lists ---------- */
export const PAGE_SIZE = 20;

// Loads a paged admin list: { items, total, page, pageSize }. Also copes with an older server that sends a plain array.
export function usePagedList(path, query) {
  const [page, setPage] = useUrlParam('page', '1');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const key = JSON.stringify(query) + page;
  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.entries({ ...query, page, pageSize: PAGE_SIZE }).filter(([, v]) => v !== '' && v != null));
    setError(null);
    return api(`${path}?${qs}`)
      .then((r) => setData(Array.isArray(r) ? { items: r, total: r.length, page: 1, pageSize: r.length || PAGE_SIZE } : r))
      .catch((e) => {
        e.notFoundHint = 'This screen needs the latest server, which is not live yet. Deploy the server, then try again.';
        setError(e);
        setData({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE });
      });
  }, [path, key]); // eslint-disable-line react-hooks/exhaustive-deps -- key covers query and page
  useEffect(() => {
    setData(null);
    load();
  }, [load]);
  return { data, error, reload: load, page: Number(page) || 1, setPage: (n) => setPage(String(n)) };
}

export function Pager({ data, setPage }) {
  if (!data || data.total <= data.pageSize) return null;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</Button>
      <span className="text-sm text-mute">Page {data.page} of {pages} · {data.total} in total</span>
      <Button variant="outline" size="sm" disabled={data.page >= pages} onClick={() => setPage(data.page + 1)}>Next</Button>
    </nav>
  );
}

// Loading, error and empty states for a list
export function ListState({ data, error, empty = 'Nothing here.' }) {
  if (error) return <ErrorNote error={error} className="mt-4" />;
  if (!data) return <div className="mt-4 h-24 animate-pulse rounded-2xl bg-line/70" />;
  if (data.items.length === 0) return <p className="mt-6 text-mute">{empty}</p>;
  return null;
}
