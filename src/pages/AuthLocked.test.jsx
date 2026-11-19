import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import AuthPage from './AuthPage';

const auth = vi.hoisted(() => ({ user: null, login: vi.fn() })); // one stable object
vi.mock('../auth', () => ({ useAuth: () => auth }));
const server = vi.hoisted(() => ({ login: null }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    if (path === '/listings/meta') return Promise.resolve({ categories: [] });
    if (path === '/auth/login' && opts.method === 'POST') return server.login();
    return new Promise(() => {});
  }),
}));

const LOCKED = 'Too many tries. Please wait 15 minutes and try again, or reset your password.';
function openLogin(url = '/auth') {
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<p>Landed on another page</p>} />
        </Routes>
      </MetaProvider>
    </MemoryRouter>,
  );
}
async function tryLogin(user) {
  await user.type(screen.getByLabelText(/^Email/), 'ada@example.com');
  await user.type(screen.getByLabelText(/^Password/), 'wrong-pass');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = null;
});

describe('login protection', () => {
  it('shows LOGIN_LOCKED clearly, with a way to reset the password, and logs nobody out', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'kept'); // e.g. another tab's login: must not be touched
    server.login = () => Promise.reject(Object.assign(new Error(LOCKED), { status: 429, code: 'LOGIN_LOCKED' }));
    openLogin();
    await tryLogin(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(LOCKED);
    expect(alert).toHaveTextContent('Resetting your password lifts the pause straight away.');
    expect(screen.getByRole('link', { name: 'Forgot password' })).toHaveAttribute('href', '/forgot-password');
    expect(localStorage.getItem('token')).toBe('kept');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('a normal wrong password still shows the plain error', async () => {
    const user = userEvent.setup();
    server.login = () => Promise.reject(Object.assign(new Error('Wrong email or password'), { status: 401 }));
    openLogin();
    await tryLogin(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password');
    expect(screen.queryByRole('link', { name: 'Forgot password' })).not.toBeInTheDocument();
  });

  it('only follows ?next= to a page on this site', async () => {
    auth.user = { id: 'b1', role: 'BUYER' };
    openLogin('/auth?next=//evil.example.com');
    expect(await screen.findByText('Landed on another page')).toBeInTheDocument(); // home, not the outside site
  });
});
