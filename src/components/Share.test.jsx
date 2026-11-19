import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { ToastProvider } from '../ui';
import ShareDeal, { canShareListing, listingLink, shareText, whatsappUrl } from './Share';
import Listing from '../pages/Listing';

const auth = vi.hoisted(() => ({ user: null }));
vi.mock('../auth', () => ({ useAuth: () => auth }));
const server = vi.hoisted(() => ({ listing: null }));
vi.mock('../api', () => ({
  api: vi.fn((path) => {
    if (path === '/listings/meta') return Promise.resolve({ categories: ['Bakery'], rules: {} });
    if (path.startsWith('/listings/')) return Promise.resolve(server.listing);
    return new Promise(() => {});
  }),
}));

const soon = (h) => new Date(Date.now() + h * 36e5).toISOString();
// Fixed times for the text: 17:30 UTC is 18:30 in Lagos
const FIXED = { id: 'l1', title: 'Agege bread', price: 1500, originalPrice: 3000, pickupBy: '2026-11-20T17:30:00Z', saleEndsAt: soon(2), status: 'ACTIVE', quantityLeft: 3, hiddenAt: null };
const LIVE = { ...FIXED, pickupBy: soon(4), category: 'Bakery', quantity: 5, area: 'Yaba', city: 'Lagos', seller: { id: 's1', businessName: 'Bola Bakery', verified: true } };

function renderShare(listing = FIXED, business = 'Bola Bakery') {
  render(<ShareDeal listing={listing} business={business} />);
}

let originalShare;
beforeEach(() => {
  vi.clearAllMocks();
  originalShare = navigator.share;
  delete navigator.share;
});
afterEach(() => {
  if (originalShare) navigator.share = originalShare;
  else delete navigator.share;
});

describe('share text', () => {
  it('follows the agreed format, with the discount from the listing and the time in Lagos', () => {
    const text = shareText(FIXED, 'Bola Bakery', 'https://www.gbaanjo.com/listing/l1');
    expect(text).toMatch(/^Bola Bakery has Agege bread at 50% off\. Now ₦1,500, collect by Fri,? 18:30\. Reserve here: https:\/\/www\.gbaanjo\.com\/listing\/l1$/);
  });

  it('links to the listing on this site', () => {
    expect(listingLink('l1', 'https://www.gbaanjo.com')).toBe('https://www.gbaanjo.com/listing/l1');
  });

  it('encodes the WhatsApp link properly', () => {
    const text = 'Bola & Sons has rice at 30% off. Now ₦1,500, collect by Fri 18:30. Reserve here: https://x.ng/listing/l1?a=1';
    const url = whatsappUrl(text);
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).not.toMatch(/[ &₦%]{2}|\s/); // no raw spaces
    expect(url).toContain('%26'); // &
    expect(url).toContain('%E2%82%A6'); // ₦
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe(text);
  });
});

describe('Share this deal button', () => {
  it("uses the phone's share sheet when there is one", async () => {
    const user = userEvent.setup();
    navigator.share = vi.fn().mockResolvedValue(undefined);
    renderShare();
    await user.click(screen.getByRole('button', { name: /Share this deal/ }));
    expect(navigator.share).toHaveBeenCalledWith({ title: 'Agege bread', text: shareText(FIXED, 'Bola Bakery', listingLink('l1')) });
    expect(screen.queryByRole('link', { name: 'Share on WhatsApp' })).not.toBeInTheDocument();
  });

  it('offers WhatsApp and Copy link when there is no share sheet', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText });
    renderShare();
    expect(screen.queryByRole('button', { name: /Share this deal/ })).not.toBeInTheDocument();
    const wa = screen.getByRole('link', { name: 'Share on WhatsApp' });
    expect(wa).toHaveAttribute('href', whatsappUrl(shareText(FIXED, 'Bola Bakery', listingLink('l1'))));
    expect(wa).toHaveAttribute('target', '_blank');
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(listingLink('l1'));
    expect(await screen.findByRole('status')).toHaveTextContent('Copied');
  });

  it('falls back to WhatsApp and Copy link if the share sheet fails (but not when the user just closes it)', async () => {
    const user = userEvent.setup();
    navigator.share = vi.fn().mockRejectedValueOnce(Object.assign(new Error('closed'), { name: 'AbortError' })).mockRejectedValueOnce(new Error('not allowed'));
    renderShare();
    await user.click(screen.getByRole('button', { name: /Share this deal/ }));
    expect(screen.queryByRole('link', { name: 'Share on WhatsApp' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Share this deal/ }));
    expect(await screen.findByRole('link', { name: 'Share on WhatsApp' })).toBeInTheDocument();
  });

  it.each([
    ['ended', { saleEndsAt: soon(-1) }],
    ['sold out', { quantityLeft: 0, status: 'SOLD_OUT' }],
    ['hidden', { hiddenAt: soon(-1) }],
    ['cancelled', { status: 'CANCELLED' }],
  ])('is not shown for a %s listing', (_, change) => {
    expect(canShareListing({ ...FIXED, ...change })).toBe(false);
    renderShare({ ...FIXED, ...change });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('on the listing page', () => {
  const openListing = (listing) => {
    auth.user = null;
    server.listing = listing;
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

  it('shows the share options on a live deal', async () => {
    openListing(LIVE);
    await screen.findByRole('heading', { name: 'Agege bread' });
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' }).getAttribute('href')).toContain(encodeURIComponent('Bola Bakery has Agege bread at 50% off'));
  });

  it('shows nothing to share on an ended deal', async () => {
    openListing({ ...LIVE, saleEndsAt: soon(-1), status: 'EXPIRED' });
    await screen.findByRole('heading', { name: 'Agege bread' });
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Share on WhatsApp' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Share/ })).not.toBeInTheDocument();
  });
});
