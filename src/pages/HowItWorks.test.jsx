import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { DEFAULT_NUMBERS, TEST_META } from '../test/testMeta';
import HowItWorks from './HowItWorks';

const server = vi.hoisted(() => ({ meta: null }));
vi.mock('../api', () => ({
  api: vi.fn((path) => (path === '/listings/meta' && server.meta ? Promise.resolve(server.meta) : new Promise(() => {}))),
}));

function Probe() {
  return <output data-testid="search">{useLocation().search}</output>;
}
function renderAt(url = '/how-it-works', meta = TEST_META) {
  server.meta = meta;
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <HowItWorks />
        <Probe />
      </MetaProvider>
    </MemoryRouter>,
  );
}
const text = () => document.body.textContent;

describe('How it works', () => {
  it('starts on the buyer path with the steps, the code, refunds and the payment hold', async () => {
    renderAt();
    expect(await screen.findByText(/at least 37% off. Here is how/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Buying, step by step' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I want to buy' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Cannot collect yourself?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Refunds' })).toBeInTheDocument();
    expect(text()).toMatch(/hold the food for 17 minutes/);
    expect(screen.getByRole('link', { name: 'See live deals' })).toHaveAttribute('href', '/deals');
  });

  it('switches to the seller path and puts it in the URL', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(screen.getByRole('button', { name: 'I sell food' }));
    expect(screen.getByRole('heading', { name: 'Selling, step by step' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I sell food' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('search')).toHaveTextContent('?for=sellers');
    for (const step of ['Apply with your CAC number', 'Get approved', 'Add your payout account', 'List your surplus', 'Hand over with the code', 'Get paid']) {
      expect(screen.getByRole('heading', { name: step })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Apply as a seller' })).toHaveAttribute('href', '/auth?mode=register&role=SELLER');
  });

  it('opens the seller path straight from a link', async () => {
    renderAt('/how-it-works?for=sellers');
    expect(screen.getByRole('heading', { name: 'Selling, step by step' })).toBeInTheDocument();
  });

  it.each([['buyers', '/how-it-works'], ['sellers', '/how-it-works?for=sellers']])('reads every number on the %s path from the server rules', async (_, url) => {
    renderAt(url);
    await screen.findByText(/at least 37% off. Here is how/);
    for (const n of DEFAULT_NUMBERS) expect(text()).not.toMatch(n);
  });

  it('shows the seller fees and categories from the server', async () => {
    renderAt('/how-it-works?for=sellers');
    await screen.findByText(/at least 37% off. Here is how/);
    expect(text()).toMatch(/keeps 12% of each order \(at least ₦75\)/);
    expect(text()).toMatch(/from 25 minutes up to 48 hours/);
    expect(text()).toMatch(/Bakery, Groceries, Zobo and drinks/);
  });

  it('falls back to config/market.js while the server has not answered', () => {
    renderAt('/how-it-works', null); // the meta request never answers
    expect(text()).toMatch(/at least 30% off/);
    expect(text()).toMatch(/hold the food for 10 minutes/);
  });
});
