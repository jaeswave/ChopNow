import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// The free server can take up to a minute to wake up, so a failed check is retried after these pauses.
export const RETRY_DELAYS_MS = [3000, 8000, 15000, 30000];
// Only the server saying "this login is not valid" (401) or "this account is blocked" (403) ends a login.
// A network error or a slow server never does.
export const endsLogin = (err) => err?.status === 401 || err?.status === 403;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [waking, setWaking] = useState(false); // true while we retry a slow or unreachable server

  const refresh = () => api('/auth/me').then(setUser).catch(() => {});
  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    let stopped = false;
    (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const me = await api('/auth/me');
          if (!stopped) setUser(me);
          break;
        } catch (err) {
          if (stopped) return;
          if (endsLogin(err)) {
            localStorage.removeItem('token');
            break;
          }
          // Out of retries: open the app as logged out for now, but keep the login so the next visit tries again
          if (attempt >= RETRY_DELAYS_MS.length) break;
          setWaking(true);
          await sleep(RETRY_DELAYS_MS[attempt]);
          if (stopped) return;
        }
      }
      setWaking(false);
      setReady(true);
    })();
    return () => { stopped = true; };
  }, []);

  const login = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  // Replace the user with a fresh copy the server sent back (e.g. after POST /me/consent)
  const updateUser = (u) => setUser(u);
  return <Ctx.Provider value={{ user, ready, waking, login, logout, refresh, updateUser }}>{children}</Ctx.Provider>;
}
