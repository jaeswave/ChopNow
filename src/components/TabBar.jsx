import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { cx } from '../ui';
import useComingSoon from '../hooks/useComingSoon';

// Simple line icons (24 x 24), drawn with the current text colour
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  deals: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  orders: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  shop: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6',
  admin: 'M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z',
  account: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
};
const Icon = ({ name }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name]} />
  </svg>
);

// The tabs for each kind of user. match(pathname) decides which tab is lit.
// comingSoon: no Deals tab while coming soon mode is on for this person
export function tabsFor(user, { comingSoon = false } = {}) {
  const tabs = [
    { to: '/', label: 'Home', icon: 'home', match: (p) => p === '/' },
    { to: '/deals', label: 'Deals', icon: 'deals', match: (p) => p.startsWith('/deals') || p.startsWith('/listing/') },
  ].filter((t) => !(comingSoon && t.to === '/deals'));
  if (user?.role === 'BUYER') tabs.push({ to: '/orders', label: 'Orders', icon: 'orders', match: (p) => p.startsWith('/orders') });
  if (user?.role === 'SELLER') tabs.push({ to: '/seller', label: 'My shop', icon: 'shop', match: (p) => p.startsWith('/seller') });
  if (user?.role === 'ADMIN') tabs.push({ to: '/admin', label: 'Admin', icon: 'admin', match: (p) => p.startsWith('/admin') });
  tabs.push({ to: '/account', label: 'Account', icon: 'account', match: (p) => p.startsWith('/account') || p.startsWith('/auth') });
  return tabs;
}

// Payment and email-link pages are single-purpose screens: no tabs there
export const hideTabBarOn = (pathname) => /^\/(pay|verify-email)(\/|$)/.test(pathname);

// True while the phone keyboard is likely open (a text field has focus)
const TYPING = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=file]):not([type=color]), textarea, select, [contenteditable="true"]';
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onIn = (e) => setOpen(!!e.target.closest?.(TYPING));
    const onOut = () => setTimeout(() => setOpen(!!document.activeElement?.closest?.(TYPING)), 0);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  return open;
}

/* The app's bottom tab bar on phones (hidden from the md breakpoint up) */
export default function TabBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const keyboard = useKeyboardOpen();
  const comingSoon = useComingSoon();
  if (hideTabBarOn(pathname) || keyboard) return null;

  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg gap-2 px-2">
        {tabsFor(user, { comingSoon }).map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-[var(--tabbar-h)] min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-palm',
                  active ? 'text-leaf' : 'text-mute hover:text-ink',
                )}
              >
                <span className={cx('grid h-7 w-12 place-items-center rounded-full', active && 'bg-leaf/10')}>
                  <Icon name={t.icon} />
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
