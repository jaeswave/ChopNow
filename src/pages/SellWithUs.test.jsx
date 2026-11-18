import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { DEFAULT_NUMBERS, TEST_META } from '../test/testMeta';
import SellWithUs from './SellWithUs';

vi.mock('../api', () => ({
  api: vi.fn((path) => (path === '/listings/meta' ? Promise.resolve(TEST_META) : new Promise(() => {}))),
}));

function renderPage() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <SellWithUs />
      </MetaProvider>
    </MemoryRouter>,
  );
  return screen.findByText(/at least 37% off, to people nearby/);
}
const total = () => screen.getByTestId('calc-total').textContent;

async function fill(user, { portions, price, discount }) {
  for (const [label, value] of [[/Portions left over/, portions], [/Normal price/, price], [/Discount/, discount]]) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, String(value));
  }
}

describe('Sell with us', () => {
  it('has the sections and the main button to seller sign-up', async () => {
    await renderPage();
    for (const h of ['What you get', 'What could you recover?', 'Join in 4 steps', 'Clear fees', 'What you need', 'Questions']) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument();
    }
    for (const link of screen.getAllByRole('link', { name: 'Apply as a seller' })) {
      expect(link).toHaveAttribute('href', '/auth?mode=register&role=SELLER');
    }
  });

  it('works out the monthly estimate after the platform percentage', async () => {
    const user = userEvent.setup();
    await renderPage();
    await fill(user, { portions: 10, price: 3000, discount: 40 });
    // 3000 at 40% off = 1800. Fee: 12% of 1800 = 216 (above the ₦75 minimum). 1584 x 10 portions x 30 days
    expect(total()).toBe('₦475,200');
    expect(document.body.textContent).toMatch(/GbaanJo keeps ₦216, you get ₦1,584\. That is ₦15,840 a day/);
  });

  it('uses the minimum fee on cheap portions', async () => {
    const user = userEvent.setup();
    await renderPage();
    await fill(user, { portions: 10, price: 500, discount: 50 });
    // 250 each. 12% would be 30, so the ₦75 minimum applies: 175 x 10 x 30
    expect(total()).toBe('₦52,500');
  });

  it('never goes below the minimum discount, and says so', async () => {
    const user = userEvent.setup();
    await renderPage();
    await fill(user, { portions: 1, price: 1000, discount: 10 });
    expect(screen.getByText(/Deals must be at least 37% off, so the estimate uses 37%/)).toBeInTheDocument();
    // 1000 at 37% off = 630. 12% = 76 (rounded), above ₦75. 554 x 30
    expect(total()).toBe('₦16,620');
  });

  it('is labelled as an estimate', async () => {
    await renderPage();
    expect(screen.getByText(/This is an estimate, not a promise/)).toBeInTheDocument();
  });

  it('shows the fees from the server, including the buyer service fee', async () => {
    await renderPage();
    expect(screen.getByText('12% (at least ₦75)')).toBeInTheDocument();
    expect(screen.getByText('₦150 per order, paid by the buyer, not you')).toBeInTheDocument();
  });

  it('has no hard-coded numbers', async () => {
    await renderPage();
    for (const n of DEFAULT_NUMBERS) expect(document.body.textContent).not.toMatch(n);
  });
});
