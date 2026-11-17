import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from '../ui';
import { api } from '../api';
import Seller from './Seller';

// Each test sets up its own seller and server replies. useAuth returns one stable object per test,
// like the real AuthProvider (a new object on every render would re-run the page's effects forever).
const mock = vi.hoisted(() => ({ auth: null, replies: {} }));
vi.mock('../auth', () => ({ useAuth: () => mock.auth }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    const key = `${opts.method || 'GET'} ${path}`;
    const match = Object.keys(mock.replies).find((k) => key.startsWith(k));
    if (!match) return Promise.reject(new Error('Not available in this test'));
    const reply = mock.replies[match];
    return typeof reply === 'function' ? reply(opts) : Promise.resolve(reply);
  }),
  download: vi.fn(),
}));

const PAYOUT_ERROR = 'Set up your payout account first (My shop, then Payouts) so you can get paid.';
const coded = (code, message) => Object.assign(new Error(message), { code });
const DRAFT_KEY = 'gj_listing_draft_7';
const LISTING = { id: 1, title: 'Agege bread', category: 'Bakery', status: 'ACTIVE', price: 700, originalPrice: 1200, quantity: 5, quantityLeft: 5, saleEndsAt: new Date(Date.now() + 36e5).toISOString() };

function setup({ user = {}, hasPayout = true, listings = [] } = {}) {
  vi.clearAllMocks();
  mock.auth = {
    user: { id: 7, role: 'SELLER', approvalStatus: 'APPROVED', businessName: 'Test Kitchen', emailVerified: true, ...user },
    refresh: vi.fn(() => Promise.resolve()),
  };
  mock.replies = {
    'GET /listings/mine/all': listings,
    'GET /orders/seller': [],
    'GET /listings/meta': { categories: ['Bakery'], cities: ['Lagos'] },
    'GET /payouts/me': { hasPayout },
    'POST /auth/resend-verification': { ok: true },
    'POST /payouts/setup': () => {
      mock.replies['GET /payouts/me'] = { hasPayout: true, bankName: 'Test Bank', accountName: 'Test Kitchen', last4: '6789' };
      return Promise.resolve({ ok: true });
    },
    'POST /listings': { id: 2 },
  };
}

// Shows the current ?query and gives the test a Back button
function Probe() {
  const { search } = useLocation();
  const nav = useNavigate();
  return (
    <>
      <output data-testid="search">{search}</output>
      <button onClick={() => nav(-1)}>Test back</button>
    </>
  );
}

function renderAt(url = '/seller') {
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <Seller />
        <Probe />
      </ToastProvider>
    </MemoryRouter>,
  );
}

const tabRow = () => screen.getByRole('button', { name: /^My listings$/ }).parentElement;
const search = () => screen.getByTestId('search').textContent;
const TABS = [/^Orders/, /^My listings$/, /New listing/, /^Insights$/, /^Payouts$/];

async function fillPayoutForm(user) {
  await user.type(await screen.findByLabelText(/Bank name/), 'Test Bank');
  await user.type(screen.getByLabelText(/Account number/), '0123456789');
  await user.type(screen.getByLabelText(/Name on the account/), 'Test Kitchen');
  await user.type(screen.getByLabelText(/GbaanJo password/), 'secret-test-pw');
  await user.click(screen.getByRole('button', { name: 'Save payout account' }));
}

describe('Seller tabs', () => {
  it('shows exactly the five tabs in one row', async () => {
    setup();
    renderAt();
    expect(await screen.findByRole('heading', { name: 'Test Kitchen' })).toBeInTheDocument();
    const buttons = within(tabRow()).getAllByRole('button');
    expect(buttons).toHaveLength(TABS.length);
    TABS.forEach((name, i) => expect(buttons[i]).toHaveAccessibleName(name));
  });

  it('renders Insights below the tab row, not inside it', async () => {
    setup();
    const user = userEvent.setup();
    renderAt();
    await user.click(within(tabRow()).getByRole('button', { name: /^Insights$/ }));
    const csv = await screen.findByRole('button', { name: /Download sales/ });
    expect(tabRow()).not.toContainElement(csv);
    expect(within(tabRow()).getAllByRole('button')).toHaveLength(TABS.length);
  });

  it('opens the tab named in the URL, as the approval email link does', async () => {
    setup({ hasPayout: false });
    renderAt('/seller?tab=payouts');
    const heading = await screen.findByRole('heading', { name: /Where should we send your money/ });
    expect(tabRow()).not.toContainElement(heading);
  });

  it('falls back to Orders for an unknown tab', async () => {
    setup();
    renderAt('/seller?tab=nonsense');
    expect(await screen.findByRole('heading', { name: 'Customer at your door?' })).toBeInTheDocument();
  });

  it('puts the tab in the URL and the Back button returns to the previous tab', async () => {
    setup();
    const user = userEvent.setup();
    renderAt();
    await user.click(within(tabRow()).getByRole('button', { name: /^Insights$/ }));
    expect(search()).toBe('?tab=insights');
    await user.click(screen.getByRole('button', { name: 'Test back' }));
    expect(search()).toBe('');
    expect(await screen.findByRole('heading', { name: 'Customer at your door?' })).toBeInTheDocument();
  });
});

describe('Finish setting up checklist', () => {
  const card = () => screen.findByRole('region', { name: 'Finish setting up' });

  it('shows progress and ticks the steps that are done', async () => {
    setup({ hasPayout: false, listings: [] });
    renderAt();
    const c = await card();
    expect(within(c).getByText('1 of 3 done')).toBeInTheDocument();
    expect(within(c).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(within(c).getByText(/Verify your email/)).toHaveTextContent('(done)');
    expect(within(c).getByText(/Add your payout account/)).toHaveTextContent('(to do)');
    expect(within(c).getByText(/Publish your first listing/)).toHaveTextContent('(to do)');
  });

  it('resends the verification email from the first step', async () => {
    setup({ user: { emailVerified: false }, hasPayout: false });
    const user = userEvent.setup();
    renderAt();
    const c = await card();
    expect(within(c).getByText('0 of 3 done')).toBeInTheDocument();
    await user.click(within(c).getByRole('button', { name: 'Resend email' }));
    expect(api).toHaveBeenCalledWith('/auth/resend-verification', { method: 'POST' });
  });

  it('disappears once the last step is done, without a reload', async () => {
    setup({ hasPayout: false, listings: [LISTING] });
    const user = userEvent.setup();
    renderAt('/seller?tab=payouts');
    expect(within(await card()).getByText('2 of 3 done')).toBeInTheDocument();
    await fillPayoutForm(user);
    expect(await screen.findByRole('button', { name: 'Continue to your listing' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Finish setting up' })).not.toBeInTheDocument();
  });

  it('stays hidden when everything is already done', async () => {
    setup({ hasPayout: true, listings: [LISTING] });
    renderAt('/seller?tab=listings');
    expect(await screen.findByText('Agege bread')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/payouts/me');
    expect(screen.queryByRole('region', { name: 'Finish setting up' })).not.toBeInTheDocument();
  });
});

describe('New listing tab', () => {
  const payoutCard = () => screen.findByRole('region', { name: /tell us where to send your money/ });

  it('shows the payout card instead of the form when there is no payout account', async () => {
    setup({ hasPayout: false });
    const user = userEvent.setup();
    renderAt('/seller?tab=new');
    const c = await payoutCard();
    expect(screen.queryByRole('button', { name: 'Publish listing' })).not.toBeInTheDocument();
    await user.click(within(c).getByRole('button', { name: 'Add payout account' }));
    expect(search()).toBe('?tab=payouts');
  });

  it('after saving payout details, Continue returns to the form', async () => {
    setup({ hasPayout: false });
    const user = userEvent.setup();
    renderAt('/seller?tab=new');
    await user.click(within(await payoutCard()).getByRole('button', { name: 'Add payout account' }));
    await fillPayoutForm(user);
    await user.click(await screen.findByRole('button', { name: 'Continue to your listing' }));
    expect(search()).toBe('?tab=new');
    expect(await screen.findByRole('button', { name: 'Publish listing' })).toBeInTheDocument();
  });

  it('asks to verify the email first, with a resend button', async () => {
    setup({ user: { emailVerified: false }, hasPayout: true });
    renderAt('/seller?tab=new');
    const c = await screen.findByRole('region', { name: /verify your email/ });
    expect(within(c).getByRole('button', { name: 'Resend email' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish listing' })).not.toBeInTheDocument();
  });

  it('shows the payout card, not a raw error, when the server answers PAYOUT_REQUIRED', async () => {
    setup({ hasPayout: true });
    mock.replies['POST /listings'] = () => Promise.reject(coded('PAYOUT_REQUIRED', 'Reworded by the server'));
    renderAt('/seller?tab=new');
    fireEvent.submit((await screen.findByRole('button', { name: 'Publish listing' })).closest('form'));
    expect(await payoutCard()).toBeInTheDocument();
    expect(screen.queryByText('Reworded by the server')).not.toBeInTheDocument();
  });

  it('shows the email card and reloads the user when the server answers EMAIL_NOT_VERIFIED', async () => {
    setup({ hasPayout: true }); // our copy of the user still says verified
    mock.replies['POST /listings'] = () => Promise.reject(coded('EMAIL_NOT_VERIFIED', 'Please verify your email first.'));
    renderAt('/seller?tab=new');
    fireEvent.submit((await screen.findByRole('button', { name: 'Publish listing' })).closest('form'));
    const c = await screen.findByRole('region', { name: /verify your email/ });
    expect(within(c).getByRole('button', { name: 'Resend email' })).toBeInTheDocument();
    expect(mock.auth.refresh).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('falls back to the wording when the server sends no code', async () => {
    setup({ hasPayout: true });
    mock.replies['POST /listings'] = () => Promise.reject(new Error(PAYOUT_ERROR));
    renderAt('/seller?tab=new');
    fireEvent.submit((await screen.findByRole('button', { name: 'Publish listing' })).closest('form'));
    expect(await payoutCard()).toBeInTheDocument();
    expect(screen.queryByText(PAYOUT_ERROR)).not.toBeInTheDocument();
  });

  it('still shows other server errors as a message', async () => {
    setup({ hasPayout: true });
    mock.replies['POST /listings'] = () => Promise.reject(new Error('Needs at least 30% off'));
    renderAt('/seller?tab=new');
    fireEvent.submit((await screen.findByRole('button', { name: 'Publish listing' })).closest('form'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Needs at least 30% off');
  });
});

describe('New listing times', () => {
  it('reads the times the seller types as Lagos time, even on a phone set to New York', async () => {
    vi.stubEnv('TZ', 'America/New_York');
    expect(new Date('2026-11-20T17:00:00Z').getHours()).toBe(12); // the phone's clock really is New York
    setup({ hasPayout: true });
    renderAt('/seller?tab=new');
    fireEvent.change(await screen.findByLabelText(/Sale ends/), { target: { value: '2026-11-20T18:00' } });
    fireEvent.change(screen.getByLabelText(/Pickup deadline/), { target: { value: '2026-11-20T20:30' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Publish listing' }).closest('form'));
    await screen.findByText('Your listing is live!');
    const [, opts] = api.mock.calls.find(([path, o]) => path === '/listings' && o?.method === 'POST');
    expect(opts.body.saleEndsAt).toBe('2026-11-20T17:00:00.000Z'); // 18:00 Lagos
    expect(opts.body.pickupBy).toBe('2026-11-20T19:30:00.000Z'); // 20:30 Lagos
  });

  it('fills the default times in Lagos time', async () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    setup({ hasPayout: true });
    renderAt('/seller?tab=new');
    const value = (await screen.findByLabelText(/Sale ends/)).value;
    // About 3 hours from now on a Lagos clock (allow a minute for the test itself)
    const lagosIn3h = new Date(Date.now() + 3 * 36e5 + 36e5).toISOString().slice(0, 16);
    const diff = Math.abs(Date.parse(value + 'Z') - Date.parse(lagosIn3h + 'Z'));
    expect(diff).toBeLessThanOrEqual(60_000);
  });
});

describe('New listing draft', () => {
  it('keeps what the seller typed when they leave and come back', async () => {
    setup({ hasPayout: true });
    const user = userEvent.setup();
    const { unmount } = renderAt('/seller?tab=new');
    await user.type(await screen.findByLabelText(/What is it/), 'Party jollof, 10 packs');
    await user.type(screen.getByLabelText(/^Area/), 'Yaba');
    unmount();

    renderAt('/seller?tab=new');
    expect(await screen.findByLabelText(/What is it/)).toHaveValue('Party jollof, 10 packs');
    expect(screen.getByLabelText(/^Area/)).toHaveValue('Yaba');
  });

  it('keeps the draft through the payout detour', async () => {
    setup({ hasPayout: true });
    const user = userEvent.setup();
    mock.replies['POST /listings'] = () => Promise.reject(coded('PAYOUT_REQUIRED', PAYOUT_ERROR));
    renderAt('/seller?tab=new');
    await user.type(await screen.findByLabelText(/What is it/), 'Fresh fish');
    mock.replies['GET /payouts/me'] = { hasPayout: false }; // the payout account went missing on the server
    fireEvent.submit(screen.getByRole('button', { name: 'Publish listing' }).closest('form'));
    await user.click(within(await screen.findByRole('region', { name: /send your money/ })).getByRole('button', { name: 'Add payout account' }));
    await fillPayoutForm(user);
    await user.click(await screen.findByRole('button', { name: 'Continue to your listing' }));
    expect(await screen.findByLabelText(/What is it/)).toHaveValue('Fresh fish');
  });

  it('clears the draft after publishing', async () => {
    setup({ hasPayout: true });
    const user = userEvent.setup();
    renderAt('/seller?tab=new');
    await user.type(await screen.findByLabelText(/What is it/), 'Meat pies');
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY)).title).toBe('Meat pies');
    fireEvent.submit(screen.getByRole('button', { name: 'Publish listing' }).closest('form'));
    expect(await screen.findByText('Your listing is live!')).toBeInTheDocument();
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    await waitFor(() => expect(search()).toBe('?tab=listings'));
  });
});

describe('Application timeline', () => {
  const steps = async () =>
    within(await screen.findByRole('list', { name: 'Your application' })).getAllByRole('listitem');

  it('shows where a pending seller is', async () => {
    setup({ user: { approvalStatus: 'PENDING', emailVerified: false } });
    renderAt();
    const [applied, email, approved] = await steps();
    expect(applied).toHaveTextContent('AppliedDone');
    expect(email).toHaveTextContent('Email verifiedIn progress');
    expect(approved).toHaveTextContent('ApprovedNot yet');
  });

  it('shows review in progress once the email is verified', async () => {
    setup({ user: { approvalStatus: 'PENDING', emailVerified: true } });
    renderAt();
    const [, email, approved] = await steps();
    expect(email).toHaveTextContent('Done');
    expect(approved).toHaveTextContent('In progress');
  });

  it('marks a rejected application as needing changes and keeps the resubmit form', async () => {
    setup({ user: { approvalStatus: 'REJECTED', emailVerified: true, rejectionReason: 'CAC number not found' } });
    renderAt();
    const [, , approved] = await steps();
    expect(approved).toHaveTextContent('Needs changes');
    expect(screen.getByText('CAC number not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resubmit application' })).toBeInTheDocument();
  });
});
