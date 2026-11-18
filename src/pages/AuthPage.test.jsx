import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import AuthPage from './AuthPage';

const auth = vi.hoisted(() => ({ user: null, login: () => {} })); // one stable object, like the real provider
vi.mock('../auth', () => ({ useAuth: () => auth }));
vi.mock('../api', () => ({ api: vi.fn(() => new Promise(() => {})) }));

const open = (url) =>
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <AuthPage />
      </MetaProvider>
    </MemoryRouter>,
  );

describe('AuthPage', () => {
  it('opens seller sign-up from the "Apply as a seller" link', () => {
    open('/auth?mode=register&role=SELLER');
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Business name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/CAC registration number/)).toBeInTheDocument();
  });

  it('still opens on log in by default', () => {
    open('/auth');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Business name/)).not.toBeInTheDocument();
  });
});
