import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('api()', () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('returns the JSON body on success and sends the saved login token', async () => {
    localStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue(json(200, { id: 1 }));
    await expect(api('/auth/me')).resolves.toEqual({ id: 1 });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/me$/);
    expect(opts.method).toBe('GET');
    expect(opts.headers.Authorization).toBe('Bearer test-token');
  });

  it('sends no Authorization header when nobody is logged in', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await api('/listings');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('sends a JSON body for POST requests', async () => {
    fetchMock.mockResolvedValue(json(201, { ok: true }));
    await api('/feedback', { method: 'POST', body: { message: 'hi' } });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ message: 'hi' });
  });

  it('throws the server message on a 401', async () => {
    fetchMock.mockResolvedValue(json(401, { statusCode: 401, message: 'Please log in again' }));
    await expect(api('/auth/me')).rejects.toThrow('Please log in again');
  });

  it('attaches the HTTP status and the stable error code from the body', async () => {
    fetchMock.mockResolvedValue(json(400, {
      message: 'Set up your payout account first (My shop, then Payouts) so you can get paid.',
      error: 'Bad Request', statusCode: 400, code: 'PAYOUT_REQUIRED',
    }));
    const err = await api('/listings', { method: 'POST', body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.code).toBe('PAYOUT_REQUIRED');
    expect(err.message).toMatch(/payout account/);
  });

  it('attaches EMAIL_NOT_VERIFIED with its 403 status', async () => {
    fetchMock.mockResolvedValue(json(403, { message: 'Please verify your email first.', error: 'Forbidden', statusCode: 403, code: 'EMAIL_NOT_VERIFIED' }));
    const err = await api('/orders', { method: 'POST', body: {} }).catch((e) => e);
    expect(err.status).toBe(403);
    expect(err.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('leaves code undefined when the server sends none, but still sets status', async () => {
    fetchMock.mockResolvedValue(json(401, { statusCode: 401, message: 'Please log in' }));
    const err = await api('/auth/me').catch((e) => e);
    expect(err.status).toBe(401);
    expect(err.code).toBeUndefined();
  });

  it('sets status without a code when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502, headers: { 'Content-Type': 'text/html' } }));
    const err = await api('/listings').catch((e) => e);
    expect(err.message).toBe('Something went wrong');
    expect(err.status).toBe(502);
    expect(err.code).toBeUndefined();
  });

  it('has no status or code when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await api('/listings').catch((e) => e);
    expect(err.status).toBeUndefined();
    expect(err.code).toBeUndefined();
  });

  it('joins a list of validation messages into one sentence', async () => {
    fetchMock.mockResolvedValue(json(400, { message: ['price must be a number', 'title is required'] }));
    await expect(api('/listings', { method: 'POST', body: {} })).rejects.toThrow(
      'price must be a number. title is required',
    );
  });

  it('falls back to a plain message when the error has no body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    await expect(api('/orders/mine')).rejects.toThrow('Something went wrong');
  });

  it('gives a friendly message when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api('/listings')).rejects.toThrow(/reach the server/);
  });

  it('explains a non-JSON success reply (usually a wrong VITE_API_URL)', async () => {
    fetchMock.mockResolvedValue(new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
    await expect(api('/listings')).rejects.toThrow('unexpected reply');
  });
});
