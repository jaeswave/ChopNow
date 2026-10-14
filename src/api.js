const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 90000); // Render's free server can take up to a minute to wake up
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. It may be waking up. Please wait a moment and try again.");
  } finally { clearTimeout(timer); }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) throw new Error(Array.isArray(data?.message) ? data.message.join('. ') : data?.message || 'Something went wrong');
  if (data === null) throw new Error('The server sent an unexpected reply. Check that VITE_API_URL points to your backend.');
  return data;
}
