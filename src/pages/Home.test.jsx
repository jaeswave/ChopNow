import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { DEFAULT_NUMBERS, TEST_META } from '../test/testMeta';
import Home from './Home';

const server = vi.hoisted(() => ({ stats: null, listings: [] }));
vi.mock('../api', () => ({
  api: vi.fn((path) => {
    if (path === '/listings/meta') return Promise.resolve(TEST_META);
    if (path === '/public/stats') return server.stats ? Promise.resolve(server.stats) : Promise.reject(new Error('down'));
    if (path.startsWith('/listings?')) return Promise.resolve(server.listings);
    return Promise.reject(new Error('Not in this test'));
  }),
}));

const soon = (h) => new Date(Date.now() + h * 36e5).toISOString();
const LISTING = { id: 9, title: 'Agege bread', category: 'Bakery', price: 600, originalPrice: 1200, quantity: 5, quantityLeft: 2, saleEndsAt: soon(1), area: 'Yaba', city: 'Lagos', seller: { businessName: 'Test Bakery', verified: true } };

function renderHome({ stats, listings = [] }) {
  server.stats = stats;
  server.listings = listings;
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <Home />
      </MetaProvider>
    </MemoryRouter>,
  );
}
const strip = () => screen.findByRole('region', { name: 'GbaanJo in numbers' });

describe('Landing page stats strip', () => {
  it('shows only the numbers above zero', async () => {
    renderHome({ stats: { liveListings: 12, mealsRescued: 0, businesses: 3 } });
    const s = await strip();
    await within(s).findByText('12');
    expect(within(s).getByText('deals live now')).toBeInTheDocument();
    expect(within(s).getByText('food businesses')).toBeInTheDocument();
    expect(within(s).queryByText('meals rescued')).not.toBeInTheDocument();
    expect(within(s).queryByText('0')).not.toBeInTheDocument();
  });

  it('says we are just getting started when every number is zero', async () => {
    renderHome({ stats: { liveListings: 0, mealsRescued: 0, businesses: 0 } });
    expect(await within(await strip()).findByText(/We are just getting started in Lagos/)).toBeInTheDocument();
    expect(screen.queryByText('deals live now')).not.toBeInTheDocument();
  });

  it('shows nothing (no made-up numbers) if the stats cannot be loaded', async () => {
    renderHome({ stats: null });
    await waitFor(() => expect(screen.queryByRole('region', { name: 'GbaanJo in numbers' })).not.toBeInTheDocument());
  });
});

describe('Landing page', () => {
  it('reads its numbers and categories from the server', async () => {
    renderHome({ stats: { liveListings: 1, mealsRescued: 0, businesses: 0 } });
    expect(await screen.findByRole('heading', { level: 1, name: /at least 37% off/ })).toBeInTheDocument();
    expect(screen.getByText('Browse 3 categories')).toBeInTheDocument();
    const cats = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('link');
    expect(cats.map((a) => a.getAttribute('href'))).toEqual(['/deals?category=Bakery', '/deals?category=Groceries', '/deals?category=Zobo%20and%20drinks']);
    for (const n of DEFAULT_NUMBERS) expect(document.body.textContent).not.toMatch(n);
  });

  it('links to live deals, how it works and selling', async () => {
    renderHome({ stats: null });
    expect(screen.getByRole('link', { name: 'See live deals' })).toHaveAttribute('href', '/deals');
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/how-it-works');
    expect(screen.getByRole('link', { name: 'Sell with us' })).toHaveAttribute('href', '/sell-with-us');
    expect(screen.getByText('Pay securely online with OPay.')).toBeInTheDocument();
  });

  it('shows Ending soon when deals are live', async () => {
    renderHome({ stats: null, listings: [LISTING] });
    expect(await screen.findByRole('heading', { name: 'Ending soon' })).toBeInTheDocument();
    expect(await screen.findByText('Agege bread')).toBeInTheDocument();
  });

  it('hides Ending soon when nothing is live', async () => {
    renderHome({ stats: null, listings: [] });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Ending soon' })).not.toBeInTheDocument());
    // still gone once the (empty) list has arrived
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.queryByRole('heading', { name: 'Ending soon' })).not.toBeInTheDocument();
  });

  it('has no hash links', () => {
    renderHome({ stats: null });
    for (const a of screen.getAllByRole('link')) expect(a.getAttribute('href')).not.toMatch(/#/);
  });
});
