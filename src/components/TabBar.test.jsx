import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabBar, { hideTabBarOn, tabsFor } from './TabBar';

const auth = vi.hoisted(() => ({ user: null })); // one stable object; tests change .user before rendering
vi.mock('../auth', () => ({ useAuth: () => auth }));

const USERS = {
  guest: null,
  buyer: { id: 1, role: 'BUYER', name: 'Test Buyer' },
  seller: { id: 2, role: 'SELLER', name: 'Test', businessName: 'Test Kitchen' },
  admin: { id: 3, role: 'ADMIN', name: 'Admin' },
};

function renderAt(path, who = 'guest', extra = null) {
  auth.user = USERS[who];
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {extra}
      <TabBar />
    </MemoryRouter>,
  );
}
const tabs = () => within(screen.getByRole('navigation', { name: 'App' })).getAllByRole('link');
const labels = () => tabs().map((a) => a.textContent);

describe('tab bar', () => {
  it.each([
    ['guest', ['Home', 'Deals', 'Account']],
    ['buyer', ['Home', 'Deals', 'Orders', 'Account']],
    ['seller', ['Home', 'Deals', 'My shop', 'Account']],
    ['admin', ['Home', 'Deals', 'Admin', 'Account']],
  ])('shows the right tabs for a %s', (who, expected) => {
    renderAt('/', who);
    expect(labels()).toEqual(expected);
    expect(tabsFor(USERS[who]).map((t) => t.label)).toEqual(expected);
  });

  it('links each tab to its page', () => {
    renderAt('/', 'seller');
    expect(tabs().map((a) => a.getAttribute('href'))).toEqual(['/', '/deals', '/seller', '/account']);
  });

  it.each([
    ['/', 'Home'],
    ['/deals?category=Bakery', 'Deals'],
    ['/listing/9', 'Deals'],
    ['/seller?tab=payouts', 'My shop'],
    ['/account', 'Account'],
  ])('highlights the current tab on %s', (path, active) => {
    renderAt(path, 'seller');
    const current = tabs().filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual([active]);
  });

  it.each(['/pay/callback', '/pay/callback?reference=x', '/verify-email', '/verify-email?token=x'])('is hidden on %s', (path) => {
    renderAt(path, 'buyer');
    expect(screen.queryByRole('navigation', { name: 'App' })).not.toBeInTheDocument();
  });

  it('is shown on other pages', () => {
    expect(hideTabBarOn('/payouts')).toBe(false);
    expect(hideTabBarOn('/orders')).toBe(false);
  });

  it('hides while a text field is focused (keyboard open) and comes back afterwards', async () => {
    renderAt('/deals', 'buyer', <><input aria-label="Search" /><input type="checkbox" aria-label="Agree" /></>);
    const search = screen.getByLabelText('Search');
    fireEvent.focusIn(search);
    expect(screen.queryByRole('navigation', { name: 'App' })).not.toBeInTheDocument();
    fireEvent.focusOut(search);
    expect(await screen.findByRole('navigation', { name: 'App' })).toBeInTheDocument();
    // a checkbox does not open the keyboard
    fireEvent.focusIn(screen.getByLabelText('Agree'));
    expect(screen.getByRole('navigation', { name: 'App' })).toBeInTheDocument();
  });

  it('is for phones only and every tab is a large tap target', () => {
    renderAt('/', 'buyer');
    expect(screen.getByRole('navigation', { name: 'App' })).toHaveClass('md:hidden');
    for (const a of tabs()) expect(a).toHaveClass('min-h-11');
  });
});
