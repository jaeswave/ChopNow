import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { ToastProvider } from '../ui';
import { api } from '../api';
import Account from '../pages/Account';
import { BLOCKER_TEXT, exportFileName } from './AccountData';

const auth = vi.hoisted(() => ({ user: null, logout: null })); // one stable object; tests set .user
vi.mock('../auth', () => ({ useAuth: () => auth }));

const server = vi.hoisted(() => ({ meta: {}, replies: {} }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    if (path === '/listings/meta') return Promise.resolve(server.meta);
    const reply = server.replies[`${opts.method || 'GET'} ${path}`];
    if (!reply) return new Promise(() => {});
    return reply(opts.body);
  }),
}));

const LEGAL = { termsVersion: 'v1', privacyVersion: 'v1' };
const USERS = {
  buyer: { id: 'b1', role: 'BUYER', name: 'Ada Buyer', emailVerified: true },
  seller: { id: 's1', role: 'SELLER', name: 'Bola', businessName: 'Bola Bakery', emailVerified: true, approvalStatus: 'APPROVED' },
  admin: { id: 'a1', role: 'ADMIN', name: 'Admin', emailVerified: true },
};
const fail = (status, message, extra = {}) => () => Promise.reject(Object.assign(new Error(message), { status, ...extra }));

function openAccount(who = 'buyer', { legal = LEGAL } = {}) {
  auth.user = USERS[who];
  auth.logout = vi.fn(() => { auth.user = null; });
  server.meta = { categories: [], ...(legal ? { legal } : {}) };
  render(
    <MemoryRouter initialEntries={['/account']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <ToastProvider>
          <Routes>
            <Route path="/account" element={<Account />} />
            <Route path="/" element={<p>Home page</p>} />
          </Routes>
        </ToastProvider>
      </MetaProvider>
    </MemoryRouter>,
  );
}
const dataSection = () => screen.findByRole('region', { name: 'Your data' });

let saved;
beforeEach(() => {
  vi.clearAllMocks();
  server.replies = {};
  saved = [];
  URL.createObjectURL = vi.fn((blob) => { saved.push(blob); return 'blob:fake'; });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { saved.name = this.download; });
});
afterEach(() => vi.restoreAllMocks());

describe('Your data', () => {
  it('is hidden while the server sends no "legal" (release safety)', async () => {
    openAccount('buyer', { legal: null });
    await screen.findByText('Ada Buyer');
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('region', { name: 'Your data' })).not.toBeInTheDocument();
  });

  it('downloads the export as gbaanjo-my-data-<date>.json', async () => {
    const user = userEvent.setup();
    server.replies['GET /me/export'] = () => Promise.resolve({ exportedAt: '2026-11-19T10:00:00Z', profile: { name: 'Ada Buyer' }, orders: [] });
    openAccount('buyer');
    await user.click(within(await dataSection()).getByRole('button', { name: 'Download' }));
    expect(await screen.findByText(/Your file has been downloaded/)).toBeInTheDocument();
    expect(saved.name).toMatch(/^gbaanjo-my-data-\d{4}-\d{2}-\d{2}\.json$/);
    expect(saved.name).toBe(exportFileName());
    expect(JSON.parse(await saved[0].text()).profile.name).toBe('Ada Buyer');
    expect(api).toHaveBeenCalledWith('/me/export'); // api() adds the login token
  });

  it('shows a clear error when the export fails', async () => {
    const user = userEvent.setup();
    server.replies['GET /me/export'] = fail(429, 'Too many requests. Please wait a minute.');
    openAccount('buyer');
    await user.click(within(await dataSection()).getByRole('button', { name: 'Download' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not prepare your data. Too many requests. Please wait a minute.');
  });
});

describe('Delete my account', () => {
  const openDialog = async (user, who = 'buyer') => {
    openAccount(who);
    await user.click(within(await dataSection()).getByRole('button', { name: 'Delete' }));
    return within(await screen.findByRole('dialog', { name: 'Delete your account?' }));
  };

  it('explains what happens and needs the password', async () => {
    const user = userEvent.setup();
    const d = await openDialog(user);
    expect(d.getByText(/Your orders and payment records stay in our records for accounting, without your name/)).toBeInTheDocument();
    expect(d.getByText('This cannot be undone.')).toBeInTheDocument();
    const confirm = d.getByRole('button', { name: 'Delete my account' });
    expect(confirm).toBeDisabled();
    await user.type(d.getByLabelText(/Your password/), 'pw');
    expect(confirm).toBeEnabled();
  });

  it('shows the server message on a wrong password and does NOT log out', async () => {
    const user = userEvent.setup();
    server.replies['POST /me/delete'] = fail(400, 'Wrong password');
    const d = await openDialog(user);
    await user.type(d.getByLabelText(/Your password/), 'nope');
    await user.click(d.getByRole('button', { name: 'Delete my account' }));
    expect(await d.findByRole('alert')).toHaveTextContent('Wrong password');
    expect(auth.logout).not.toHaveBeenCalled();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('lists each blocker in plain words and says the request is recorded', async () => {
    const user = userEvent.setup();
    server.replies['POST /me/delete'] = fail(409, 'We cannot delete your account yet.', {
      code: 'DELETION_BLOCKED',
      blockers: [{ code: 'UNPAID_ORDER', message: 'server words' }, { code: 'PAYOUT_PENDING', message: 'server words' }],
    });
    const d = await openDialog(user, 'seller');
    await user.type(d.getByLabelText(/Your password/), 'right-pw');
    await user.click(d.getByRole('button', { name: 'Delete my account' }));
    const alert = await d.findByRole('alert');
    const items = within(alert).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual([BLOCKER_TEXT.UNPAID_ORDER, BLOCKER_TEXT.PAYOUT_PENDING]);
    expect(alert).toHaveTextContent('We have recorded your request. An admin will finish deleting your account once these are closed.');
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('has a plain sentence for every blocker code', () => {
    expect(Object.keys(BLOCKER_TEXT).sort()).toEqual(['LIVE_LISTING', 'OPEN_SALES', 'PAYOUT_PENDING', 'REFUND_PENDING', 'UNCOLLECTED_ORDER', 'UNPAID_ORDER']);
  });

  it('on success logs out, goes home and confirms', async () => {
    const user = userEvent.setup();
    server.replies['POST /me/delete'] = () => Promise.resolve({ ok: true });
    const d = await openDialog(user);
    await user.type(d.getByLabelText(/Your password/), 'right-pw');
    await user.click(d.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(auth.logout).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Your account has been deleted.');
    const call = api.mock.calls.find(([p, o]) => p === '/me/delete' && o?.method === 'POST');
    expect(call[1].body).toEqual({ password: 'right-pw' });
  });

  it('is not offered to admin accounts', async () => {
    openAccount('admin');
    const section = await dataSection();
    expect(within(section).getByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(within(section).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
