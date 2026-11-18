import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { DEFAULT_NUMBERS, TEST_META } from '../test/testMeta';
import Home from './Home';
import { HERO_ALT } from '../sections/Hero';

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

describe('Landing page hero', () => {
  const hero = () => screen.getByRole('heading', { level: 1 }).closest('section');

  it('has the big headline', () => {
    renderHome({ stats: null });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Surprise your taste buds. Pay less.');
  });

  it('shows the discount from the server rules (37%), never a typed-in 30', async () => {
    renderHome({ stats: null });
    expect(await within(hero()).findByText(/at least 37% off/, { selector: 'strong' })).toBeInTheDocument();
    expect(hero()).toHaveTextContent('Great food from Lagos kitchens, at least 37% off, ready to collect near you.');
    expect(within(hero()).getByText('37%+ off')).toBeInTheDocument(); // the sticker on the picture
    expect(hero().textContent).not.toMatch(/30%/);
  });

  it('never says "food waste"', () => {
    renderHome({ stats: null });
    expect(hero().textContent).not.toMatch(/food waste/i);
  });

  it('has the main picture: alt text, a fixed size and not lazy-loaded', () => {
    renderHome({ stats: null });
    const img = within(hero()).getByRole('img', { name: HERO_ALT });
    expect(HERO_ALT.length).toBeGreaterThan(20);
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img.getAttribute('srcset')).toMatch(/480w.*800w/);
    // a modern format first, with a fallback
    const source = img.closest('picture').querySelector('source');
    expect(source).toHaveAttribute('type', 'image/avif');
    expect(img.getAttribute('src')).toMatch(/\.webp$/);
  });

  it('keeps the category chips and the Live deals button', () => {
    renderHome({ stats: null });
    expect(within(hero()).getByRole('link', { name: 'See live deals' })).toHaveAttribute('href', '/deals');
    expect(within(hero()).getByRole('navigation', { name: 'Categories' })).toBeInTheDocument();
  });
});

describe('Landing page', () => {
  it('reads its numbers and categories from the server', async () => {
    renderHome({ stats: { liveListings: 1, mealsRescued: 0, businesses: 0 } });
    expect(await screen.findByText(/at least 37% off/, { selector: 'strong' })).toBeInTheDocument();
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
