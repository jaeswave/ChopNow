import { registerServiceWorker } from './registerSW';

// Makes the website behave like an installable phone app.
// setupPwa(): call once at start-up. It adds any missing <head> tags, catches the install prompt and,
// in production only, registers the service worker (public/sw.js).

const HEAD_TAGS = [
  ['link', { rel: 'manifest', href: '/manifest.webmanifest' }],
  ['meta', { name: 'theme-color', content: '#0E3B2C' }],
  ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
  ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
  ['meta', { name: 'apple-mobile-web-app-title', content: 'GbaanJo' }],
  ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
  ['link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
];

export function addHeadTags(doc = document) {
  for (const [tag, attrs] of HEAD_TAGS) {
    const key = attrs.rel ? `link[rel="${attrs.rel}"]` : `meta[name="${attrs.name}"]`;
    if (doc.head.querySelector(key)) continue;
    const el = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    doc.head.appendChild(el);
  }
  // Let the page run under the notch and the home bar; the layout pads itself with env(safe-area-inset-*)
  let viewport = doc.head.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = doc.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    doc.head.appendChild(viewport);
  }
  if (!/viewport-fit=cover/.test(viewport.content)) viewport.setAttribute('content', viewport.content + ', viewport-fit=cover');
}

/* ---------- Install prompt (Android Chrome and other Chromium browsers) ---------- */
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((f) => f());

export const canPromptInstall = () => !!deferred;
// subscribe(fn) -> unsubscribe. fn runs when the prompt becomes available, is used, or the app is installed.
export const onInstallChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

// Shows the browser's own install dialog. Resolves to 'accepted', 'dismissed' or 'unavailable'.
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  notify();
  e.prompt();
  const { outcome } = await e.userChoice;
  return outcome;
}

export function captureInstallPrompt(win = window) {
  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own card at a better moment
    deferred = e;
    notify();
  });
  win.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/* ---------- What kind of device is this ---------- */
export const isStandalone = (win = window) =>
  win.matchMedia?.('(display-mode: standalone)').matches || win.navigator.standalone === true;

// iPhone or iPad Safari (iPadOS reports itself as a Mac with touch)
export const isIOS = (nav = navigator) =>
  /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);

export const isPhone = (win = window) => !!win.matchMedia?.('(max-width: 767px) and (pointer: coarse)').matches;

export function setupPwa() {
  addHeadTags();
  captureInstallPrompt();
  registerServiceWorker();
}
