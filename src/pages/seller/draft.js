import { fromLagosInput } from '../../components/time';

// Keeps a half-filled "New listing" form for this browser tab, so a detour (for example to add a
// payout account, or a page refresh) loses nothing. sessionStorage is cleared when the tab is closed.
const key = (userId) => `gj_listing_draft_${userId}`;

export function loadDraft(userId) {
  try {
    const s = sessionStorage.getItem(key(userId));
    return s ? JSON.parse(s) : null;
  } catch {
    return null; // private mode or a broken value: start with an empty form
  }
}

export function saveDraft(userId, form) {
  try {
    sessionStorage.setItem(key(userId), JSON.stringify(form));
  } catch {
    /* storage full or blocked: the form still works, it just is not kept */
  }
}

export function clearDraft(userId) {
  try {
    sessionStorage.removeItem(key(userId));
  } catch {
    /* nothing to do */
  }
}

// Merge a saved draft into a fresh form. Only known fields are kept, and sale times
// that have already passed are replaced with fresh ones.
export function restoreForm(draft, fresh) {
  if (!draft || typeof draft !== 'object') return fresh;
  const form = { ...fresh };
  for (const k of Object.keys(fresh)) if (typeof draft[k] === 'string') form[k] = draft[k];
  if (!(fromLagosInput(form.saleEndsAt).getTime() > Date.now())) {
    form.saleEndsAt = fresh.saleEndsAt;
    form.pickupBy = fresh.pickupBy;
  }
  return form;
}
