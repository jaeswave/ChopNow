import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../ui';
import { api } from '../api';
import Admin from './Admin';

const auth = vi.hoisted(() => ({ user: null })); // one stable object; tests set .user
vi.mock('../auth', () => ({ useAuth: () => auth }));

// Fake server: replies[key] where key is "METHOD /path" (no query). A function gets (query, body).
const server = vi.hoisted(() => ({ replies: {} }));
vi.mock('../api', () => ({
  api: vi.fn((url, opts = {}) => {
    const [path, qs = ''] = url.split('?');
    const reply = server.replies[`${opts.method || 'GET'} ${path}`];
    if (reply === undefined) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }));
    const value = typeof reply === 'function' ? reply(new URLSearchParams(qs), opts.body) : reply;
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
  }),
}));

const ADMIN = { id: 'a1', role: 'ADMIN', name: 'Ada Admin' };
const paged = (items, total = items.length, page = 1) => ({ items, total, page, pageSize: 20 });
const httpError = (status, message) =>
  Object.assign(new Error(Array.isArray(message) ? message.join('. ') : message), { status, ...(Array.isArray(message) ? { messages: message } : {}) });
const calls = (method, path) => api.mock.calls.filter(([u, o = {}]) => u.split('?')[0] === path && (o.method || 'GET') === method);
const lastQuery = (path) => new URLSearchParams(calls('GET', path).at(-1)[0].split('?')[1]);

function openAdmin(url, user = ADMIN) {
  auth.user = user;
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}
const dialog = () => screen.findByRole('dialog');

beforeEach(() => {
  vi.clearAllMocks();
  server.replies = {};
});

describe('admin access', () => {
  it.each([
    ['a guest', null],
    ['a buyer', { id: 'b', role: 'BUYER', name: 'Buyer' }],
    ['a seller', { id: 's', role: 'SELLER', name: 'Seller' }],
  ])('sends %s home without loading any admin data', async (_, user) => {
    openAdmin('/admin?tab=orders', user);
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin' })).not.toBeInTheDocument();
    expect(api.mock.calls.filter(([u]) => u.startsWith('/admin'))).toHaveLength(0);
  });

  it('lets an admin in, starting on the overview', async () => {
    server.replies['GET /admin/overview'] = { pendingApps: 0 };
    openAdmin('/admin');
    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
  });
});

describe('Overview', () => {
  it('shows the six counts, each linking to its screen', async () => {
    server.replies['GET /admin/overview'] = { pendingApps: 2, liveListings: 14, ordersToday: 9, problemOrders: 1, openFeedback: 3, suspended: 1, fees: 98000, sales: 812000 };
    openAdmin('/admin?tab=overview');
    const box = within(await screen.findByRole('region', { name: 'Needs attention' }));
    const link = (name) => box.getByRole('link', { name });
    expect(link(/Sellers waiting for approval\s*2/)).toHaveAttribute('href', '/admin?tab=sellers&status=pending');
    expect(link(/Live listings\s*14/)).toHaveAttribute('href', '/admin?tab=listings&status=ACTIVE');
    expect(link(/Paid orders today\s*9/).getAttribute('href')).toMatch(/^\/admin\?tab=orders&from=\d{4}-\d\d-\d\d&to=\d{4}-\d\d-\d\d$/);
    expect(link(/Problem orders.*1/)).toHaveAttribute('href', '/admin?tab=orders&status=RESERVED');
    expect(link(/Open feedback\s*3/)).toHaveAttribute('href', '/admin?tab=feedback&status=open');
    expect(link(/Suspended users\s*1/)).toHaveAttribute('href', '/admin?tab=users');
  });
});

describe('Seller approvals', () => {
  const seller = { id: 's1', name: 'Bola', email: 'bola@example.com', phone: '0800', businessName: 'Bola Bakery', rcNumber: 'RC123', emailVerifiedAt: null, approvalStatus: 'PENDING', createdAt: '2026-11-18T10:00:00Z' };

  it('loads pending sellers, paged', async () => {
    server.replies['GET /admin/sellers'] = paged([seller]);
    openAdmin('/admin?tab=sellers');
    expect(await screen.findByText('Bola Bakery')).toBeInTheDocument();
    const q = lastQuery('/admin/sellers');
    expect([q.get('status'), q.get('page'), q.get('pageSize')]).toEqual(['pending', '1', '20']);
  });

  it('approves with one confirm, and shows the server error when the email is not verified', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/sellers'] = paged([seller]);
    server.replies['POST /admin/sellers/s1/approve'] = httpError(400, 'This seller has not verified their email yet');
    openAdmin('/admin?tab=sellers');
    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    const d = within(await dialog());
    await user.click(d.getByRole('button', { name: 'Approve' }));
    expect(await d.findByRole('alert')).toHaveTextContent('This seller has not verified their email yet');
    expect(calls('POST', '/admin/sellers/s1/approve')).toHaveLength(1);
  });

  it('rejects only with a reason (not blank), and sends it trimmed', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/sellers'] = paged([seller]);
    server.replies['POST /admin/sellers/s1/reject'] = { ok: true };
    openAdmin('/admin?tab=sellers');
    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    const d = within(await dialog());
    const confirm = d.getByRole('button', { name: 'Reject' });
    expect(confirm).toBeDisabled();
    await user.type(d.getByLabelText(/Why are you rejecting/), '    ');
    expect(confirm).toBeDisabled(); // spaces only is not a reason
    await user.type(d.getByLabelText(/Why are you rejecting/), 'CAC name does not match  ');
    await user.click(confirm);
    await waitFor(() => expect(calls('POST', '/admin/sellers/s1/reject')).toHaveLength(1));
    expect(calls('POST', '/admin/sellers/s1/reject')[0][1].body).toEqual({ reason: 'CAC name does not match' });
    expect(await screen.findByText('Application rejected and emailed')).toBeInTheDocument();
  });
});

describe('Orders', () => {
  const order = {
    id: 'o1', orderNo: 'GJ-AB12CD', status: 'RESERVED', refundDue: false, paymentRef: 'gj_ref_1',
    pickupCode: '482917', // a server should never send this; the screen must never show it anyway
    buyer: { id: 'b1', name: 'Chidi Buyer', email: 'chidi@example.com', phone: '0801' },
    seller: { id: 's1', businessName: 'Bola Bakery', email: 'bola@example.com', phone: '0802' },
    items: [{ listingId: 'l1', title: 'Agege bread', quantity: 2, unitPrice: 600 }],
    amounts: { food: 1200, buyerFee: 100, amountPaid: 1300, platformFee: 120, sellerAmount: 1080 },
    pickupBy: '2026-11-18T18:00:00Z',
    timeline: [{ event: 'created', at: '2026-11-18T09:00:00Z' }, { event: 'paid', at: '2026-11-18T09:02:00Z' }],
    lastChangedAt: '2026-11-18T09:02:00Z',
  };

  it('searches, filters by status and date, and is paged', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/orders'] = paged([order], 45);
    openAdmin('/admin?tab=orders');
    expect(await screen.findByText('GJ-AB12CD')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Search/), 'bola');
    await waitFor(() => expect(lastQuery('/admin/orders').get('search')).toBe('bola'));
    await user.selectOptions(screen.getByLabelText('Status'), 'RESERVED');
    await waitFor(() => expect(lastQuery('/admin/orders').get('status')).toBe('RESERVED'));
    await user.type(screen.getByLabelText('From (Lagos date)'), '2026-11-18');
    await waitFor(() => expect(lastQuery('/admin/orders').get('from')).toBe('2026-11-18'));
    expect(screen.getByText('Page 1 of 3 · 45 in total')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(lastQuery('/admin/orders').get('page')).toBe('2'));
  });

  it('shows buyer, seller, items, amounts and timeline, and NEVER the pickup code', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/orders'] = paged([order]);
    openAdmin('/admin?tab=orders');
    await user.click(await screen.findByRole('button', { name: 'Details' }));
    const d = await dialog();
    for (const text of ['Chidi Buyer', 'chidi@example.com', 'Bola Bakery', '2 × Agege bread', '₦1,300', '₦1,080', 'Order placed', 'Paid', 'gj_ref_1']) {
      expect(within(d).getAllByText(text, { exact: false }).length).toBeGreaterThan(0);
    }
    expect(document.body.textContent).not.toContain('482917');
  });

  it('cancels only with a reason and says a refund is owed for a paid order', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/orders'] = paged([order]);
    server.replies['POST /admin/orders/o1/cancel'] = { ok: true, refund: true };
    openAdmin('/admin?tab=orders');
    await user.click(await screen.findByRole('button', { name: 'Details' }));
    await user.click(within(await dialog()).getByRole('button', { name: 'Cancel order' }));
    const d = within(await screen.findByRole('dialog', { name: /Cancel order GJ-AB12CD/ }));
    expect(d.getByText(/a refund will be owed/)).toBeInTheDocument();
    const confirm = d.getByRole('button', { name: 'Cancel order' });
    expect(confirm).toBeDisabled();
    await user.type(d.getByLabelText(/Why are you cancelling/), 'Seller closed early');
    await user.click(confirm);
    expect(await screen.findByText(/A refund is owed: it is on the Refunds list/)).toBeInTheDocument();
    expect(calls('POST', '/admin/orders/o1/cancel')[0][1].body).toEqual({ reason: 'Seller closed early' });
  });

  it('shows each message of a 400 message list', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/orders'] = paged([order]);
    server.replies['POST /admin/orders/o1/cancel'] = httpError(400, ['Give a reason (a few words is enough)', 'reason must be 300 characters or fewer']);
    openAdmin('/admin?tab=orders');
    await user.click(await screen.findByRole('button', { name: 'Details' }));
    await user.click(within(await dialog()).getByRole('button', { name: 'Cancel order' }));
    const d = within(await screen.findByRole('dialog', { name: /Cancel order/ }));
    await user.type(d.getByLabelText(/Why are you cancelling/), 'x');
    await user.click(d.getByRole('button', { name: 'Cancel order' }));
    const items = within(await d.findByRole('alert')).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['Give a reason (a few words is enough)', 'reason must be 300 characters or fewer']);
  });

  it('says clearly when the live server does not have this screen yet', async () => {
    openAdmin('/admin?tab=orders'); // no reply set: the fake server answers 404
    expect(await screen.findByRole('alert')).toHaveTextContent(/needs the latest server/);
  });
});

describe('Listings', () => {
  const live = { id: 'l1', title: 'Jollof packs', status: 'ACTIVE', price: 1500, originalPrice: 3000, quantity: 10, quantityLeft: 4, area: 'Yaba', city: 'Lagos', seller: { businessName: 'Mama Put' }, hiddenAt: null, hiddenReason: null };
  const hidden = { ...live, id: 'l2', title: 'Old fish', hiddenAt: '2026-11-18T12:00:00Z', hiddenReason: 'Photo shows a different dish' };

  it('marks hidden listings with when and why', async () => {
    server.replies['GET /admin/listings'] = [live, hidden];
    openAdmin('/admin?tab=listings');
    expect(await screen.findByText('Hidden by GbaanJo')).toBeInTheDocument();
    expect(screen.getByText(/Photo shows a different dish/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unhide' })).toBeInTheDocument();
  });

  it('hides only with a reason', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/listings'] = [live];
    server.replies['POST /admin/listings/l1/hide'] = { ok: true };
    openAdmin('/admin?tab=listings');
    await user.click(await screen.findByRole('button', { name: 'Hide' }));
    const d = within(await dialog());
    expect(d.getByRole('button', { name: 'Hide listing' })).toBeDisabled();
    await user.type(d.getByLabelText(/Why are you hiding/), 'Wrong photo');
    await user.click(d.getByRole('button', { name: 'Hide listing' }));
    await waitFor(() => expect(calls('POST', '/admin/listings/l1/hide')[0][1].body).toEqual({ reason: 'Wrong photo' }));
  });
});

describe('Users', () => {
  it('suspends only with a reason, and shows the server message for an admin', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/users'] = [{ id: 'u9', role: 'ADMIN', name: 'Other Admin', email: 'o@example.com', createdAt: '2026-01-01T00:00:00Z', suspended: false }];
    server.replies['POST /admin/users/u9/suspend'] = httpError(400, 'Admins cannot be suspended');
    openAdmin('/admin?tab=users');
    await user.click(await screen.findByRole('button', { name: 'Suspend' }));
    const d = within(await dialog());
    expect(d.getByRole('button', { name: 'Suspend' })).toBeDisabled();
    await user.type(d.getByLabelText(/Why are you suspending/), 'Test');
    await user.click(d.getByRole('button', { name: 'Suspend' }));
    expect(await d.findByRole('alert')).toHaveTextContent('Admins cannot be suspended');
  });

  it('restores a suspended user with a reason', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/users'] = [{ id: 'u2', role: 'BUYER', name: 'Chidi', email: 'c@example.com', createdAt: '2026-01-01T00:00:00Z', suspended: true }];
    server.replies['POST /admin/users/u2/unsuspend'] = { ok: true };
    openAdmin('/admin?tab=users');
    await user.click(await screen.findByRole('button', { name: 'Restore' }));
    const d = within(await dialog());
    await user.type(d.getByLabelText(/Why are you restoring/), 'Paid back');
    await user.click(d.getByRole('button', { name: 'Restore account' }));
    await waitFor(() => expect(calls('POST', '/admin/users/u2/unsuspend')[0][1].body).toEqual({ reason: 'Paid back' }));
  });
});

describe('Feedback', () => {
  it('shows open feedback by default and resolves it', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/feedback'] = paged([{ id: 'f1', category: 'BUG', rating: 2, message: 'Map did not load', status: 'NEW', createdAt: '2026-11-18T08:00:00Z', user: null, name: 'Tola' }]);
    server.replies['POST /admin/feedback/f1/resolve'] = { ok: true };
    openAdmin('/admin?tab=feedback');
    expect(await screen.findByText('Map did not load')).toBeInTheDocument();
    expect(lastQuery('/admin/feedback').get('status')).toBe('open');
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    await user.click(within(await dialog()).getByRole('button', { name: 'Resolve' }));
    await waitFor(() => expect(calls('POST', '/admin/feedback/f1/resolve')).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(lastQuery('/admin/feedback').get('status')).toBe('done'));
  });
});

describe('Audit log', () => {
  it('shows admin, action, target, reason and Lagos time, newest first as sent', async () => {
    server.replies['GET /admin/audit'] = paged([
      { id: 'a2', action: 'listing.hide', targetType: 'listing', targetId: 'l1', reason: 'Wrong photo', createdAt: '2026-11-18T13:05:00Z', admin: { id: 'a1', name: 'Ada Admin', email: 'ada@example.com' } },
      { id: 'a1', action: 'seller.approve', targetType: 'user', targetId: 's1', reason: null, createdAt: '2026-11-18T09:00:00Z', admin: { id: 'a1', name: 'Ada Admin', email: 'ada@example.com' } },
    ]);
    openAdmin('/admin?tab=audit');
    const rows = await screen.findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Hid listing');
    expect(rows[0]).toHaveTextContent('Ada Admin');
    expect(rows[0]).toHaveTextContent('Reason: Wrong photo');
    expect(rows[0]).toHaveTextContent('18/11/2026, 14:05:00'); // 13:05 UTC is 14:05 in Lagos
    expect(rows[1]).toHaveTextContent('Approved seller');
  });
});

describe('Deletion requests', () => {
  const req = (over = {}) => ({ id: 'u5', name: 'Kemi Seller', email: 'kemi@example.com', role: 'SELLER', businessName: 'Kemi Foods', deletionRequestedAt: '2026-11-18T13:05:00Z', createdAt: '2026-01-01T00:00:00Z', blockers: [], ...over });

  it('lists name, email, role, business, date and the blocker CODES, not the user-worded messages', async () => {
    server.replies['GET /admin/deletion-requests'] = paged([req({ blockers: [{ code: 'PAYOUT_PENDING', message: 'We still owe you a payout.' }] }), req({ id: 'u6', name: 'Tunde', role: 'BUYER', businessName: null })]);
    openAdmin('/admin?tab=deletions');
    const rows = await screen.findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Kemi Foods');
    expect(rows[0]).toHaveTextContent('kemi@example.com');
    expect(rows[0]).toHaveTextContent('SELLER');
    expect(rows[0]).toHaveTextContent('Asked 18/11/2026, 14:05:00');
    expect(within(rows[0]).getByText('PAYOUT_PENDING')).toBeInTheDocument();
    expect(screen.queryByText('We still owe you a payout.')).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing open: this can be finished now/)).toBeInTheDocument();
    expect(lastQuery('/admin/deletion-requests').get('pageSize')).toBe('20');
  });

  it('anonymises after a confirm', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/deletion-requests'] = paged([req()]);
    server.replies['POST /admin/users/u5/anonymise'] = { ok: true };
    openAdmin('/admin?tab=deletions');
    await user.click(await screen.findByRole('button', { name: 'Anonymise' }));
    const d = within(await dialog());
    expect(d.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(calls('POST', '/admin/users/u5/anonymise')).toHaveLength(0); // nothing happens before the confirm
    await user.click(d.getByRole('button', { name: 'Anonymise' }));
    await waitFor(() => expect(calls('POST', '/admin/users/u5/anonymise')).toHaveLength(1));
    expect(await screen.findByText('Account anonymised')).toBeInTheDocument();
  });

  it('shows 409 blocker codes in the dialog', async () => {
    const user = userEvent.setup();
    server.replies['GET /admin/deletion-requests'] = paged([req()]);
    server.replies['POST /admin/users/u5/anonymise'] = Object.assign(httpError(409, 'We cannot delete this account yet.'), { code: 'DELETION_BLOCKED', blockers: [{ code: 'LIVE_LISTING', message: 'x' }, { code: 'OPEN_SALES', message: 'y' }] });
    openAdmin('/admin?tab=deletions');
    await user.click(await screen.findByRole('button', { name: 'Anonymise' }));
    const d = within(await dialog());
    await user.click(d.getByRole('button', { name: 'Anonymise' }));
    const alert = await d.findByRole('alert');
    expect(within(alert).getByRole('list', { name: 'Still open' })).toHaveTextContent('LIVE_LISTINGOPEN_SALES');
  });

  it('tags users who asked for, or completed, deletion', async () => {
    server.replies['GET /admin/users'] = [
      { id: 'u1', role: 'BUYER', name: 'Asked', email: 'a@example.com', createdAt: '2026-01-01T00:00:00Z', deletionRequestedAt: '2026-11-18T10:00:00Z', deletedAt: null },
      { id: 'u2', role: 'BUYER', name: 'Deleted user', email: 'deleted@example.invalid', createdAt: '2026-01-01T00:00:00Z', deletionRequestedAt: '2026-11-18T10:00:00Z', deletedAt: '2026-11-19T10:00:00Z' },
    ];
    openAdmin('/admin?tab=users');
    const rows = await screen.findAllByRole('listitem');
    expect(within(rows[0]).getByText('Deletion requested')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Deleted')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('Deletion requested')).not.toBeInTheDocument();
  });
});
