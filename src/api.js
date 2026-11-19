const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');


// The thrown Error carries the HTTP status and, when the server sends one, a stable code such as
// 'PAYOUT_REQUIRED' (see API conventions in CLAUDE.md). Check err.code, never the wording of err.message.
function httpError(status, data) {
  const msg = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
  const err = new Error(msg || 'Something went wrong');
  err.status = status;
  if (typeof data?.code === 'string') err.code = data.code;
  // A 400 from validation sends a list of messages; keep the list so screens can show each one
  if (Array.isArray(data?.message)) err.messages = data.message.map(String);
  // Extra details some errors carry, e.g. DELETION_BLOCKED's list of blockers
  if (Array.isArray(data?.blockers)) err.blockers = data.blockers;
  return err;
}

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
  if (!res.ok) throw httpError(res.status, data);
  if (data === null) throw new Error('The server sent an unexpected reply. Check that VITE_API_URL points to your backend.');
  return data;
}

// Saves a file from the server (for example the sales spreadsheet). It sends the login token, which a plain link cannot do.
export async function download(path, filename) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  if (!res.ok) throw new Error('Could not download the file. Please try again.');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
