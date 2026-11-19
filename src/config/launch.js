// Coming soon mode: set VITE_COMING_SOON=true (in Vercel, or a local .env) to show visitors and buyers a
// "coming soon" site with a waitlist. Missing or any other value: the normal site.
export const comingSoonSwitch = () => import.meta.env.VITE_COMING_SOON === 'true';

/* ---------- Preview unlock (a soft lock, NOT security) ----------
 * VITE_PREVIEW_CODE holds a word. Opening any page with ?preview=<that word> remembers it in this browser, and the
 * visitor then sees the full site in coming soon mode, like a seller or admin. Like every VITE_ value, the word is
 * inside the public website code, so anyone determined can find it. Empty: the feature is off. */
const PREVIEW_KEY = 'gj_preview';
const PREVIEW_EVENT = 'gj:preview';
export const previewCode = () => (import.meta.env.VITE_PREVIEW_CODE || '').trim();

// The stored word must match today's code, so changing VITE_PREVIEW_CODE locks old previews out again
export function isPreviewUnlocked() {
  const code = previewCode();
  if (!code) return false;
  try { return localStorage.getItem(PREVIEW_KEY) === code; } catch { return false; }
}

const notifyPreview = () => window.dispatchEvent(new Event(PREVIEW_EVENT));
export function subscribePreview(fn) {
  window.addEventListener(PREVIEW_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(PREVIEW_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}

// ?preview=<word>: remembers it and returns true when the word is right. A wrong word does nothing.
export function capturePreview(search) {
  const code = previewCode();
  if (!code || new URLSearchParams(search).get('preview') !== code) return false;
  try { localStorage.setItem(PREVIEW_KEY, code); } catch { return false; }
  notifyPreview();
  return true;
}

export function leavePreview() {
  try { localStorage.removeItem(PREVIEW_KEY); } catch { /* nothing stored */ }
  notifyPreview();
}
