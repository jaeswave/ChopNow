import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Account from './Account';

const auth = vi.hoisted(() => ({ user: null, logout: () => {} })); // one stable object per test
vi.mock('../auth', () => ({ useAuth: () => auth }));

const USERS = {
  buyer: { id: 1, role: 'BUYER', name: 'Ada Buyer', city: 'Lagos', emailVerified: true },
  seller: { id: 2, role: 'SELLER', name: 'Bola', businessName: 'Bola Bakery', city: 'Lagos', emailVerified: true, approvalStatus: 'APPROVED' },
  admin: { id: 3, role: 'ADMIN', name: 'Admin Person', emailVerified: true },
};

function renderAs(who) {
  auth.user = who ? USERS[who] : null;
  auth.logout = vi.fn();
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Account />
    </MemoryRouter>,
  );
}
const linksIn = (name) => within(screen.getByRole('list', { name })).getAllByRole('link').map((a) => [a.textContent.replace('›', '').replace(/^\W+/u, '').trim(), a.getAttribute('href')]);
const HELP = [['How it works', '/how-it-works'], ['Sell with us', '/sell-with-us'], ['Send us feedback', '/feedback'], ['Terms and refunds', '/terms']];

describe('Account page', () => {
  it('for a guest: log in, install row and help, no log out', () => {
    renderAs(null);
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/auth');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/auth?mode=register');
    expect(screen.getByText('Add to home screen')).toBeInTheDocument();
    expect(linksIn('Help')).toEqual(HELP);
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('for a buyer: profile, orders shortcut, help and log out', async () => {
    renderAs('buyer');
    const profile = screen.getByRole('region', { name: 'Your profile' });
    expect(within(profile).getByText('Ada Buyer')).toBeInTheDocument();
    expect(within(profile).getByText(/Buyer · Lagos/)).toBeInTheDocument();
    expect(within(profile).getByText('✓ Email verified')).toBeInTheDocument();
    expect(linksIn('Shortcuts')).toEqual([['My orders', '/orders'], ['Live deals', '/deals']]);
    expect(linksIn('Help')).toEqual(HELP);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it('for a seller: business name and shop shortcuts', () => {
    renderAs('seller');
    expect(within(screen.getByRole('region', { name: 'Your profile' })).getByText('Bola Bakery')).toBeInTheDocument();
    expect(linksIn('Shortcuts')).toEqual([['My shop', '/seller'], ['New listing', '/seller?tab=new'], ['Payout account', '/seller?tab=payouts'], ['Insights', '/seller?tab=insights']]);
  });

  it('for a seller still under review: says so', () => {
    USERS.seller.approvalStatus = 'PENDING';
    renderAs('seller');
    expect(screen.getByText('Application under review')).toBeInTheDocument();
    USERS.seller.approvalStatus = 'APPROVED';
  });

  it('for an admin: the admin shortcut', () => {
    renderAs('admin');
    expect(screen.getByText('Admin Person')).toBeInTheDocument();
    expect(linksIn('Shortcuts')[0]).toEqual(['Admin', '/admin']);
  });

  it('shows when the email is not verified yet', () => {
    USERS.buyer.emailVerified = false;
    renderAs('buyer');
    expect(screen.getByText('Email not verified yet')).toBeInTheDocument();
    USERS.buyer.emailVerified = true;
  });
});
