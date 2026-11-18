// Registers the service worker (public/sw.js) in production builds only, so local development is never cached.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the site works without it */
    });
  });
}
