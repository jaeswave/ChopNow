import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { api } from './api';
import { AuthProvider, RETRY_DELAYS_MS, useAuth } from './auth';

vi.mock('./api', () => ({ api: vi.fn() }));

const httpError = (status) => Object.assign(new Error('nope'), { status });
const networkError = () => new Error("Can't reach the server. It may be waking up.");
const USER = { id: 1, name: 'Test Buyer', role: 'BUYER' };

function State() {
  const { user, ready, waking } = useAuth();
  return <output data-testid="state">{JSON.stringify({ user: user?.name || null, ready, waking })}</output>;
}
const state = () => JSON.parse(screen.getByTestId('state').textContent);
const start = () => render(<AuthProvider><State /></AuthProvider>);
const flush = () => act(async () => { await Promise.resolve(); });
const wait = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe('login check at start-up', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('is ready at once when nobody is logged in', async () => {
    start();
    await flush();
    expect(state()).toEqual({ user: null, ready: true, waking: false });
    expect(api).not.toHaveBeenCalled();
  });

  it('restores the user when the server answers', async () => {
    localStorage.setItem('token', 't');
    api.mockResolvedValue(USER);
    start();
    await flush();
    expect(state()).toEqual({ user: 'Test Buyer', ready: true, waking: false });
  });

  it.each([401, 403])('logs out on a %s', async (status) => {
    localStorage.setItem('token', 't');
    api.mockRejectedValue(httpError(status));
    start();
    await flush();
    expect(state()).toMatchObject({ user: null, ready: true });
    expect(localStorage.getItem('token')).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it.each([['a network error', networkError], ['a server error (500)', () => httpError(500)], ['a timeout (502 from a sleeping server)', () => httpError(502)]])(
    'keeps the login and retries after %s',
    async (_, makeError) => {
      localStorage.setItem('token', 't');
      api.mockRejectedValueOnce(makeError()).mockRejectedValueOnce(makeError()).mockResolvedValue(USER);
      start();
      await flush();
      expect(state()).toEqual({ user: null, ready: false, waking: true }); // "Waking up the server..."
      expect(localStorage.getItem('token')).toBe('t');
      await wait(RETRY_DELAYS_MS[0]);
      await wait(RETRY_DELAYS_MS[1]);
      expect(state()).toEqual({ user: 'Test Buyer', ready: true, waking: false });
      expect(api).toHaveBeenCalledTimes(3);
    },
  );

  it('gives up after about a minute but keeps the login for next time', async () => {
    localStorage.setItem('token', 't');
    api.mockRejectedValue(networkError());
    start();
    await flush();
    for (const ms of RETRY_DELAYS_MS) await wait(ms);
    expect(state()).toEqual({ user: null, ready: true, waking: false });
    expect(localStorage.getItem('token')).toBe('t');
    expect(api).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length + 1);
  });

  it('a 401 during the retries still logs out', async () => {
    localStorage.setItem('token', 't');
    api.mockRejectedValueOnce(networkError()).mockRejectedValue(httpError(401));
    start();
    await flush();
    await wait(RETRY_DELAYS_MS[0]);
    expect(state()).toMatchObject({ user: null, ready: true });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
