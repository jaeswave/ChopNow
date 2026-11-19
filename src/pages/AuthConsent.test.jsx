import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MetaProvider } from '../hooks/useMeta';
import { api } from '../api';
import AuthPage from './AuthPage';

const auth = vi.hoisted(() => ({ user: null, login: vi.fn() })); // one stable object
vi.mock('../auth', () => ({ useAuth: () => auth }));

const server = vi.hoisted(() => ({ meta: {}, register: null }));
vi.mock('../api', () => ({
  api: vi.fn((path, opts = {}) => {
    if (path === '/listings/meta') return Promise.resolve(server.meta);
    if (path === '/auth/register' && opts.method === 'POST') return server.register ? server.register(opts.body) : Promise.resolve({ token: 't', user: { id: 1 } });
    return new Promise(() => {});
  }),
}));

const LEGAL = { termsVersion: '2026-12-01', privacyVersion: '2026-12-01-p' };
const registerCalls = () => api.mock.calls.filter(([p, o]) => p === '/auth/register' && o?.method === 'POST');

function openSignUp(meta) {
  server.meta = { categories: ['Bakery'], cities: ['Lagos'], ...meta };
  render(
    <MemoryRouter initialEntries={['/auth?mode=register']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MetaProvider>
        <AuthPage />
      </MetaProvider>
    </MemoryRouter>,
  );
}
// Fill each field in one step (typing letter by letter is slow and not what these tests are about)
async function fillForm(user) {
  await user.selectOptions(await screen.findByLabelText(/City/), 'Lagos');
  for (const [label, value] of [[/Full name/, 'Test Buyer'], [/Phone number/, '08012345678'], [/^Email/, 'test@example.com'], [/^Password/, 'secret-pass-1']]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}
const createButton = () => screen.getByRole('button', { name: 'Create account' });

beforeEach(() => {
  vi.clearAllMocks();
  server.register = null;
});

describe('sign-up consent', () => {
  it('without "legal" from the server: no checkbox, nothing extra sent (exactly as before)', async () => {
    const user = userEvent.setup();
    openSignUp({}); // an older server: no legal
    await fillForm(user);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/By creating an account you agree to our/)).toBeInTheDocument();
    expect(createButton()).toBeEnabled();
    await user.click(createButton());
    await waitFor(() => expect(registerCalls()).toHaveLength(1));
    const body = registerCalls()[0][1].body;
    expect(body).not.toHaveProperty('termsVersion');
    expect(body).not.toHaveProperty('privacyVersion');
  });

  it('with "legal": a required checkbox, links that keep the form, and the versions are sent', async () => {
    const user = userEvent.setup();
    openSignUp({ legal: LEGAL });
    const box = await screen.findByRole('checkbox', { name: /I agree to the Terms and the Privacy Policy/ });
    expect(box).toBeRequired();
    for (const [name, href] of [['Terms', '/terms'], ['Privacy Policy', '/terms#privacy']]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank'); // opens beside the form, which is kept
    }
    expect(screen.queryByText(/By creating an account you agree to our/)).not.toBeInTheDocument();
    await fillForm(user);
    expect(createButton()).toBeDisabled();
    await user.click(box);
    expect(createButton()).toBeEnabled();
    await user.click(createButton());
    await waitFor(() => expect(registerCalls()).toHaveLength(1));
    expect(registerCalls()[0][1].body).toMatchObject({ termsVersion: '2026-12-01', privacyVersion: '2026-12-01-p' });
  });

  it('shows CONSENT_REQUIRED clearly and asks to tick again', async () => {
    const user = userEvent.setup();
    server.register = () => Promise.reject(Object.assign(new Error('Please read and accept the latest Terms and Privacy Policy to continue.'), { status: 400, code: 'CONSENT_REQUIRED' }));
    openSignUp({ legal: LEGAL });
    await fillForm(user);
    await user.click(await screen.findByRole('checkbox'));
    await user.click(createButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Please read and accept the latest Terms and Privacy Policy to continue.');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(createButton()).toBeDisabled();
  });
});
