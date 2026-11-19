import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { MetaProvider } from '../hooks/useMeta';
import { ToastProvider } from '../ui';
import { api } from '../api';
import { TEST_META } from '../test/testMeta';
import App from '../App';
import { WAITLIST_THANKS, waitlistCities } from '../components/Waitlist';

// The whole app (header, menu, tab bar, footer, pages) with the real login provider and a fake server
const server = vi.hoisted(() => ({ me: null, waitlist: null }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    const p = path.split('?')[0];
    if (p === '/listings/meta') return Promise.resolve({ ...TEST_META, cities: ['Lagos'], comingSoon: ['Abuja', 'Ibadan', 'Other'] });
    if (p === '/auth/me') return server.me ? Promise.resolve(server.me) : Promise.reject(Object.assign(new Error('Please log in'), { status: 401 }));
    if (p === '/waitlist' && opts.method === 'POST') return server.waitlist(opts.body);
    if (p === '/listings' || p === '/listings/mine/all' || p === '/orders/seller' || p === '/admin/sellers') return Promise.resolve([]);
    if (p === '/public/stats') return Promise.resolve({ liveListings: 0, mealsRescued: 0, businesses: 0 });
    return new Promise(() => {});
  }),
}));

const USERS = {
  buyer: { id: 'b1', role: 'BUYER', name: 'Ada Buyer', emailVerified: true },
  seller: { id: 's1', role: 'SELLER', name: 'Bola', businessName: 'Bola Bakery', approvalStatus: 'APPROVED', emailVerified: true },
  admin: { id: 'a1', role: 'ADMIN', name: 'Admin', emailVerified: true },
};

function openSite(path = '/', who = null, on = true) {
  if (on) vi.stubEnv('VITE_COMING_SOON', 'true');
  localStorage.setItem('gj_city', 'Lagos'); // the city question was answered earlier
  if (who) localStorage.setItem('token', 'tok');
  server.me = who ? USERS[who] : null;
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <MetaProvider>
            <App />
          </MetaProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
const dealLinks = () => screen.queryAllByRole('link').filter((a) => /^\/deals|^\/listing\//.test(a.getAttribute('href') || ''));

beforeEach(() => {
  vi.clearAllMocks();
  server.waitlist = () => Promise.resolve({ ok: true });
});

describe('coming soon mode is off', () => {
  it.each([[undefined], ['false'], ['TRUE '], ['yes']])('VITE_COMING_SOON=%s: the normal site, exactly as today', async (value) => {
    if (value !== undefined) vi.stubEnv('VITE_COMING_SOON', value);
    openSite('/', null, false);
    expect(await screen.findByText('Live in Lagos')).toBeInTheDocument();
    expect(screen.queryByText('Coming soon to Lagos')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Live deals/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'See live deals' })).toHaveAttribute('href', '/deals');
  });
});

describe('coming soon mode is on', () => {
  it('a logged-out visitor sees the coming soon home and no deals link anywhere', async () => {
    openSite('/');
    expect(await screen.findByText('Coming soon to Lagos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Surprise your taste buds. Pay less.');
    expect(screen.getByRole('link', { name: 'I run a food business' })).toHaveAttribute('href', '/sell-with-us');
    for (const line of ['Find a deal near you.', 'Reserve it online.', 'Collect it with a 6-digit code.']) expect(screen.getByText(line)).toBeInTheDocument();
    expect(dealLinks()).toEqual([]); // header pill, menu, footer, tab bar, hero chips: none
    expect(screen.queryByRole('region', { name: 'GbaanJo in numbers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ending soon' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'App' })).queryByRole('link', { name: /Deals/ })).not.toBeInTheDocument();
    // still open: How it works, Sell with us, Log in, the legal page
    for (const href of ['/how-it-works', '/sell-with-us', '/auth', '/terms']) expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === href)).toBe(true);
  });

  it('takes the minimum discount from the server rules (37%) for the text and the page description', async () => {
    openSite('/');
    expect(await screen.findByText(/at least 37% off/)).toBeInTheDocument();
    expect(document.body.textContent).toContain('Great food from Lagos kitchens, at least 37% off, ready to collect near you. We are opening very soon.');
    expect(document.body.textContent).not.toMatch(/\b30%/);
    await waitFor(() => expect(document.title).toBe('GbaanJo | Great food, fewer naira, Lagos'));
    expect(document.querySelector('meta[name="description"]').content).toBe('GbaanJo helps you find great food from Lagos kitchens at least 37% off. Join the waitlist.');
  });

  it.each(['/deals', '/listing/abc'])('%s shows "We are opening soon" with the waitlist form, not an error', async (path) => {
    openSite(path);
    expect(await screen.findByRole('heading', { name: 'We are opening soon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join the waitlist' })).toBeInTheDocument();
    expect(api.mock.calls.some(([p]) => p.startsWith('/listings?') || p.startsWith('/listings/abc'))).toBe(false);
  });

  it('a buyer also gets the coming soon site, so no new orders start', async () => {
    openSite('/deals', 'buyer');
    expect(await screen.findByRole('heading', { name: 'We are opening soon' })).toBeInTheDocument();
    expect(dealLinks()).toEqual([]);
  });

  it.each(['seller', 'admin'])('a logged-in %s still sees deals', async (who) => {
    openSite('/deals', who);
    expect(await screen.findByRole('heading', { name: 'Live deals' })).toBeInTheDocument();
    expect(screen.queryByText('We are opening soon')).not.toBeInTheDocument();
    expect(dealLinks().length).toBeGreaterThan(0);
  });

  it('the waitlist sends email and city (Lagos chosen) and says thank you', async () => {
    const user = userEvent.setup();
    openSite('/');
    const form = within(await screen.findByRole('form', { name: 'Join the waitlist' }));
    expect(form.getByLabelText('Your city')).toHaveValue('Lagos');
    fireEvent.change(form.getByLabelText('Your email'), { target: { value: ' ada@example.com ' } });
    await user.click(form.getByRole('button', { name: 'Join the waitlist' }));
    expect(await screen.findByText(`✓ ${WAITLIST_THANKS}`)).toBeInTheDocument();
    const call = api.mock.calls.find(([p, o]) => p === '/waitlist' && o?.method === 'POST');
    expect(call[1].body).toEqual({ email: 'ada@example.com', city: 'Lagos' });
  });

  it("offers the server's cities (Lagos first and chosen, then the coming-soon list with Other) and sends the one picked", async () => {
    const user = userEvent.setup();
    openSite('/');
    const form = within(await screen.findByRole('form', { name: 'Join the waitlist' }));
    const select = form.getByLabelText('Your city');
    await waitFor(() => expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Lagos', 'Abuja', 'Ibadan', 'Other']));
    expect(select).toHaveValue('Lagos');
    expect(form.queryByLabelText('Which city?')).not.toBeInTheDocument(); // no typed city any more
    fireEvent.change(form.getByLabelText('Your email'), { target: { value: 'ada@example.com' } });
    await user.selectOptions(select, 'Ibadan');
    await user.click(form.getByRole('button', { name: 'Join the waitlist' }));
    await screen.findByText(`✓ ${WAITLIST_THANKS}`);
    expect(api.mock.calls.find(([p]) => p === '/waitlist')[1].body).toEqual({ email: 'ada@example.com', city: 'Ibadan' });
  });

  it('falls back to Lagos alone until the server answers, and never repeats a city', () => {
    expect(waitlistCities(null)).toEqual(['Lagos']);
    expect(waitlistCities({ cities: ['Lagos'], comingSoon: ['Lagos', 'Abuja', 'Other'] })).toEqual(['Lagos', 'Abuja', 'Other']);
  });

  it.each([
    ['a 400 message list', () => Promise.reject(Object.assign(new Error('email must be an email'), { status: 400, messages: ['email must be an email', 'city must be longer than or equal to 2 characters'] })), 'email must be an email. city must be longer than or equal to 2 characters'],
    ['a plain message', () => Promise.reject(Object.assign(new Error("Can't reach the server. It may be waking up."), {})), "Can't reach the server. It may be waking up."],
    ['the rate limit', () => Promise.reject(Object.assign(new Error('ThrottlerException: Too Many Requests'), { status: 429 })), 'Please wait a minute, then try again.'],
  ])('shows the server error: %s', async (_, reply, text) => {
    const user = userEvent.setup();
    server.waitlist = reply;
    openSite('/');
    const form = within(await screen.findByRole('form', { name: 'Join the waitlist' }));
    fireEvent.change(form.getByLabelText('Your email'), { target: { value: 'ada@example.com' } });
    await user.click(form.getByRole('button', { name: 'Join the waitlist' }));
    expect(await form.findByRole('alert')).toHaveTextContent(text);
    expect(screen.queryByText(`✓ ${WAITLIST_THANKS}`)).not.toBeInTheDocument();
  });
});
