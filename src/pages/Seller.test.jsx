import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../ui';
import Seller from './Seller';

// One stable object, like the real AuthProvider. A new object on every render would re-run the page's effects forever.
const auth = vi.hoisted(() => ({
  user: { id: 1, role: 'SELLER', approvalStatus: 'APPROVED', businessName: 'Test Kitchen', emailVerified: true },
}));
vi.mock('../auth', () => ({ useAuth: () => auth }));

vi.mock('../api', () => {
  const replies = {
    '/listings/mine/all': [],
    '/orders/seller': [],
    '/listings/meta': { categories: [], cities: ['Lagos'] },
    '/payouts/me': { hasPayout: false },
  };
  return {
    api: vi.fn((path) => {
      const key = Object.keys(replies).find((k) => path.startsWith(k));
      return key ? Promise.resolve(replies[key]) : Promise.reject(new Error('Not available in this test'));
    }),
    download: vi.fn(),
  };
});

const TABS = [/^Orders/, /^My listings$/, /New listing/, /^Insights$/, /^Payouts$/];

function renderSeller() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <Seller />
      </ToastProvider>
    </MemoryRouter>,
  );
  // The tab row is the element that holds the "My listings" tab
  return screen.getByRole('button', { name: /^My listings$/ }).parentElement;
}

describe('Seller page tabs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the business name and exactly the five tabs in one row', async () => {
    const row = renderSeller();
    expect(await screen.findByRole('heading', { name: 'Test Kitchen' })).toBeInTheDocument();
    const buttons = within(row).getAllByRole('button');
    expect(buttons).toHaveLength(TABS.length);
    TABS.forEach((name, i) => expect(buttons[i]).toHaveAccessibleName(name));
  });

  it('renders Insights below the tab row, not inside it', async () => {
    const user = userEvent.setup();
    const row = renderSeller();
    await user.click(within(row).getByRole('button', { name: /^Insights$/ }));
    const csv = await screen.findByRole('button', { name: /Download sales/ });
    expect(row).not.toContainElement(csv);
    expect(within(row).getAllByRole('button')).toHaveLength(TABS.length);
  });

  it('renders Payouts below the tab row with the manual bank form', async () => {
    const user = userEvent.setup();
    const row = renderSeller();
    await user.click(within(row).getByRole('button', { name: /^Payouts$/ }));
    const heading = await screen.findByRole('heading', { name: /Where should we send your money/ });
    expect(row).not.toContainElement(heading);
    expect(screen.getByLabelText(/Bank name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name on the account/)).toBeInTheDocument();
  });
});
