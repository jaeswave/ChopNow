import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { ToastProvider } from '../ui';
import { api } from '../api';
import ReportButton, { REPORT_REASONS } from './Report';
import Listing from '../pages/Listing';
import Orders from '../pages/Orders';

const auth = vi.hoisted(() => ({ user: null })); // one stable object; tests set .user
vi.mock('../auth', () => ({ useAuth: () => auth }));

const server = vi.hoisted(() => ({ replies: {} }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    const reply = server.replies[`${opts.method || 'GET'} ${path.split('?')[0]}`];
    if (reply === undefined) return new Promise(() => {});
    return typeof reply === 'function' ? reply(opts.body) : Promise.resolve(reply);
  }),
}));

const BUYER = { id: 'b1', role: 'BUYER', name: 'Ada', emailVerified: true };
const SELLER = { id: 's1', role: 'SELLER', name: 'Bola', businessName: 'Bola Bakery', approvalStatus: 'APPROVED', emailVerified: true };
const fail = (status, message, code) => () => Promise.reject(Object.assign(new Error(message), { status, ...(code ? { code } : {}) }));
const reportCalls = () => api.mock.calls.filter(([p, o]) => p === '/reports' && o?.method === 'POST');

function renderButton(user = BUYER, path = '/listing/l1') {
  auth.user = user;
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="*" element={<ReportButton targetType="listing" targetId="l1" label="Report this listing" />} />
      </Routes>
    </MemoryRouter>,
  );
}
async function openAndPick(user, reason = 'Rude, threatening or unsafe behaviour') {
  await user.click(screen.getByRole('button', { name: /Report this listing/ }));
  const d = within(await screen.findByRole('dialog'));
  if (reason) await user.click(d.getByRole('radio', { name: reason }));
  return d;
}

beforeEach(() => {
  vi.clearAllMocks();
  server.replies = {};
});

describe('report dialog', () => {
  it('offers the seven reasons with plain labels, and needs one before sending', async () => {
    const user = userEvent.setup();
    renderButton();
    const d = await openAndPick(user, null);
    expect(d.getAllByRole('radio').map((r) => r.closest('label').textContent)).toEqual(REPORT_REASONS.map(([, l]) => l));
    expect(d.getByRole('button', { name: 'Send report' })).toBeDisabled();
  });

  it('sends the right body, with the note trimmed, and says thank you', async () => {
    const user = userEvent.setup();
    server.replies['POST /reports'] = { ok: true, id: 'r1' };
    renderButton();
    const d = await openAndPick(user, 'The food looked or tasted unsafe');
    await user.type(d.getByLabelText(/Anything else/), '  Smelled off  ');
    expect(d.getByText('15/300 characters')).toBeInTheDocument();
    await user.click(d.getByRole('button', { name: 'Send report' }));
    expect(await d.findByText('Thanks, we will look into it.')).toBeInTheDocument();
    expect(reportCalls()[0][1].body).toEqual({ targetType: 'listing', targetId: 'l1', reason: 'UNSAFE_FOOD', note: 'Smelled off' });
    // never says or hints that the seller is told who reported
    expect(screen.getByRole('dialog').textContent).not.toMatch(/seller (will|is) (be )?(told|notified|informed)|tell the seller/i);
  });

  it('leaves the note out when it is empty', async () => {
    const user = userEvent.setup();
    server.replies['POST /reports'] = { ok: true, id: 'r1' };
    renderButton();
    const d = await openAndPick(user, 'Something else');
    await user.click(d.getByRole('button', { name: 'Send report' }));
    await d.findByText('Thanks, we will look into it.');
    expect(reportCalls()[0][1].body).toEqual({ targetType: 'listing', targetId: 'l1', reason: 'OTHER' });
  });

  it('asks a logged-out visitor to log in and come back', async () => {
    const user = userEvent.setup();
    renderButton(null, '/listing/l1?from=deals');
    await user.click(screen.getByRole('button', { name: /Report this listing/ }));
    const d = within(await screen.findByRole('dialog'));
    expect(d.getByText(/Please log in to send a report/)).toBeInTheDocument();
    expect(d.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/auth?next=%2Flisting%2Fl1%3Ffrom%3Ddeals');
    expect(d.queryByRole('radio')).not.toBeInTheDocument();
    expect(reportCalls()).toHaveLength(0);
  });

  it.each([
    ['REPORT_EXISTS (409)', fail(409, 'server words', 'REPORT_EXISTS'), 'You have already reported this. We are looking into it.'],
    ['REPORT_LIMIT (429)', fail(429, 'server words', 'REPORT_LIMIT'), 'You have sent too many reports today. Please try again tomorrow.'],
    ['a plain 429', fail(429, 'ThrottlerException: Too Many Requests'), 'Please slow down a little. Wait a minute, then try again.'],
    ['any other error', fail(400, 'You cannot report your own listing'), 'You cannot report your own listing'],
  ])('explains %s', async (_, reply, text) => {
    const user = userEvent.setup();
    server.replies['POST /reports'] = reply;
    renderButton();
    const d = await openAndPick(user);
    await user.click(d.getByRole('button', { name: 'Send report' }));
    expect(await d.findByRole('alert')).toHaveTextContent(text);
  });
});

describe('where the Report button appears', () => {
  const listing = { id: 'l1', title: 'Agege bread', category: 'Bakery', status: 'ACTIVE', price: 600, originalPrice: 1200, quantity: 5, quantityLeft: 2, saleEndsAt: new Date(Date.now() + 36e5).toISOString(), pickupBy: new Date(Date.now() + 72e5).toISOString(), area: 'Yaba', city: 'Lagos', seller: { id: 's1', businessName: 'Bola Bakery', verified: true } };
  const openListing = (user) => {
    auth.user = user;
    server.replies['GET /listings/l1'] = listing;
    server.replies['GET /listings/meta'] = { categories: ['Bakery'], rules: {} };
    render(
      <MemoryRouter initialEntries={['/listing/l1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MetaProvider>
          <ToastProvider>
            <Routes><Route path="/listing/:id" element={<Listing />} /></Routes>
          </ToastProvider>
        </MetaProvider>
      </MemoryRouter>,
    );
  };

  it('shows on a listing for buyers and visitors', async () => {
    openListing(BUYER);
    expect(await screen.findByRole('heading', { name: 'Agege bread' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Report this listing/ })).toBeInTheDocument();
  });

  it('is hidden for the seller of that listing', async () => {
    openListing(SELLER);
    expect(await screen.findByRole('heading', { name: 'Agege bread' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Report/ })).not.toBeInTheDocument();
  });

  it('reports the seller (by id) from the buyer order page', async () => {
    const user = userEvent.setup();
    auth.user = BUYER;
    server.replies['GET /orders/mine'] = [{ id: 'o1', orderNo: 'GJ-1', status: 'PICKED_UP', quantity: 1, totalPrice: 600, createdAt: new Date().toISOString(), listing: { ...listing, seller: { id: 's1', businessName: 'Bola Bakery', phone: '0800' } } }];
    server.replies['GET /listings/meta'] = { rules: { HOLD_MINUTES: 10 } };
    server.replies['POST /reports'] = { ok: true, id: 'r9' };
    render(
      <MemoryRouter initialEntries={['/orders']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider><Orders /></ToastProvider>
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Past (1)' }));
    await user.click(await screen.findByRole('button', { name: /Report seller/ }));
    const d = within(await screen.findByRole('dialog', { name: 'Report Bola Bakery' }));
    await user.click(d.getByRole('radio', { name: 'The seller was closed or not there at pickup time' }));
    await user.click(d.getByRole('button', { name: 'Send report' }));
    await waitFor(() => expect(reportCalls()).toHaveLength(1));
    expect(reportCalls()[0][1].body).toEqual({ targetType: 'user', targetId: 's1', reason: 'SELLER_ABSENT' });
  });
});
