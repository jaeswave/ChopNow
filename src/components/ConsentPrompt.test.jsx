import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../auth';
import { MetaProvider } from '../hooks/useMeta';
import { api } from '../api';
import ConsentPrompt from './ConsentPrompt';

// The real login provider, with a fake server behind it
const server = vi.hoisted(() => ({ meta: {}, me: null }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    if (path === '/listings/meta') return Promise.resolve(server.meta);
    if (path === '/auth/me') return Promise.resolve(server.me);
    if (path === '/me/consent' && opts.method === 'POST') return Promise.resolve({ ...server.me, consentRequired: false });
    return new Promise(() => {});
  }),
}));

const LEGAL = { termsVersion: 'v7', privacyVersion: 'p7' };
function Who() {
  const { user, ready } = useAuth();
  return <output data-testid="who">{ready ? user?.name || 'logged out' : 'loading'}</output>;
}
function openAt(path, { legal = LEGAL, consentRequired = true, role = 'BUYER' } = {}) {
  localStorage.setItem('token', 'tok');
  server.meta = { categories: ['Bakery'], ...(legal ? { legal } : {}) };
  server.me = { id: 'u1', name: 'Ada', role, consentRequired };
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <MetaProvider>
          <Routes>
            <Route path="*" element={<p>Page underneath</p>} />
          </Routes>
          <Who />
          <ConsentPrompt />
        </MetaProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
const prompt = () => screen.queryByRole('dialog', { name: 'Please accept the updated Terms' });

beforeEach(() => vi.clearAllMocks());

describe('asking existing users again (consentRequired)', () => {
  it('shows a full-screen prompt after login, and clears after accepting', async () => {
    const user = userEvent.setup();
    openAt('/deals');
    expect(await screen.findByRole('dialog', { name: 'Please accept the updated Terms' })).toBeInTheDocument();
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms and the Privacy Policy/ }));
    await user.click(cont);
    await waitFor(() => expect(prompt()).not.toBeInTheDocument());
    const call = api.mock.calls.find(([p, o]) => p === '/me/consent' && o?.method === 'POST');
    expect(call[1].body).toEqual({ termsVersion: 'v7', privacyVersion: 'p7' });
    expect(screen.getByTestId('who')).toHaveTextContent('Ada'); // still logged in
  });

  it('lets the user log out instead', async () => {
    const user = userEvent.setup();
    openAt('/');
    await user.click(await screen.findByRole('button', { name: 'Log out' }));
    expect(screen.getByTestId('who')).toHaveTextContent('logged out');
    expect(localStorage.getItem('token')).toBeNull();
    expect(prompt()).not.toBeInTheDocument();
  });

  it('is not shown when the server sends no "legal" (release safety)', async () => {
    openAt('/deals', { legal: null });
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('Ada'));
    await new Promise((r) => setTimeout(r, 50));
    expect(prompt()).not.toBeInTheDocument();
    expect(api.mock.calls.some(([p]) => p === '/me/consent')).toBe(false);
  });

  it('is not shown once the user has accepted', async () => {
    openAt('/deals', { consentRequired: false });
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('Ada'));
    expect(prompt()).not.toBeInTheDocument();
  });

  it.each(['/admin', '/admin?tab=orders', '/terms', '/pay/callback'])('does not cover %s', async (path) => {
    openAt(path, { role: path.startsWith('/admin') ? 'ADMIN' : 'BUYER' });
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('Ada'));
    await new Promise((r) => setTimeout(r, 50));
    expect(prompt()).not.toBeInTheDocument();
    expect(screen.getByText('Page underneath')).toBeInTheDocument();
  });
});
