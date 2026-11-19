import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { MetaProvider } from '../hooks/useMeta';
import { ToastProvider } from '../ui';
import { TEST_META } from '../test/testMeta';
import App from '../App';
import { capturePreview, isPreviewUnlocked } from '../config/launch';

vi.mock('../api', () => ({
  api: vi.fn((path) => {
    const p = path.split('?')[0];
    if (p === '/listings/meta') return Promise.resolve({ ...TEST_META, cities: ['Lagos'], comingSoon: ['Abuja', 'Other'] });
    if (p === '/auth/me') return Promise.reject(Object.assign(new Error('Please log in'), { status: 401 }));
    if (p === '/listings') return Promise.resolve([]);
    if (p === '/public/stats') return Promise.resolve({ liveListings: 0, mealsRescued: 0, businesses: 0 });
    return new Promise(() => {});
  }),
}));

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}
function openSite(path, code = 'mango') {
  vi.stubEnv('VITE_COMING_SOON', 'true');
  vi.stubEnv('VITE_PREVIEW_CODE', code);
  localStorage.setItem('gj_city', 'Lagos');
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <MetaProvider>
            <App />
            <Where />
          </MetaProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
const previewTag = () => screen.queryByText('Preview mode');

beforeEach(() => vi.clearAllMocks());

describe('preview unlock', () => {
  it('the right word unlocks the full site, is remembered, and leaves the address bar', async () => {
    openSite('/deals?preview=mango&category=Bakery');
    expect(await screen.findByRole('heading', { name: 'Live deals' })).toBeInTheDocument();
    expect(screen.queryByText('We are opening soon')).not.toBeInTheDocument();
    expect(localStorage.getItem('gj_preview')).toBe('mango');
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/deals?category=Bakery'));
    expect(previewTag()).toBeInTheDocument();
    expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/deals')).toBe(true); // Live deals is back
  });

  it('stays unlocked on later visits in the same browser', async () => {
    localStorage.setItem('gj_preview', 'mango');
    openSite('/listing/abc');
    await waitFor(() => expect(screen.queryByText('We are opening soon')).not.toBeInTheDocument());
    expect(previewTag()).toBeInTheDocument();
  });

  it('a wrong word does nothing and shows no error', async () => {
    openSite('/deals?preview=apple');
    expect(await screen.findByRole('heading', { name: 'We are opening soon' })).toBeInTheDocument();
    expect(localStorage.getItem('gj_preview')).toBeNull();
    expect(screen.getByTestId('where')).toHaveTextContent('/deals?preview=apple'); // untouched
    expect(previewTag()).not.toBeInTheDocument();
    expect(screen.queryByText(/wrong|invalid|incorrect/i)).not.toBeInTheDocument();
  });

  it('Leave preview clears it and brings coming soon back', async () => {
    const user = userEvent.setup();
    localStorage.setItem('gj_preview', 'mango');
    openSite('/');
    expect(await screen.findByText('Live in Lagos')).toBeInTheDocument(); // the normal home
    await user.click(screen.getByRole('button', { name: 'Leave preview' }));
    expect(localStorage.getItem('gj_preview')).toBeNull();
    expect(await screen.findByText('Coming soon to Lagos')).toBeInTheDocument();
    expect(previewTag()).not.toBeInTheDocument();
  });

  it('an empty code turns the feature off, even with an old word stored', async () => {
    localStorage.setItem('gj_preview', 'mango');
    openSite('/deals?preview=mango', '');
    expect(await screen.findByRole('heading', { name: 'We are opening soon' })).toBeInTheDocument();
    expect(previewTag()).not.toBeInTheDocument();
    expect(capturePreview('?preview=')).toBe(false);
    expect(isPreviewUnlocked()).toBe(false);
  });

  it('a changed code locks old previews out', async () => {
    localStorage.setItem('gj_preview', 'mango');
    openSite('/deals', 'papaya');
    expect(await screen.findByRole('heading', { name: 'We are opening soon' })).toBeInTheDocument();
  });
});
