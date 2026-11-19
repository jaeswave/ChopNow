import { useEffect, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { capturePreview, isPreviewUnlocked, leavePreview, subscribePreview } from '../config/launch';

// { unlocked, leave }: whether this browser was unlocked with ?preview=<word> (see config/launch.js)
export default function usePreview() {
  const unlocked = useSyncExternalStore(subscribePreview, isPreviewUnlocked, () => false);
  return { unlocked, leave: leavePreview };
}

// Reads ?preview=<word> on any page. The right word is remembered and then taken out of the address bar,
// so a shared link does not pass it on. A wrong word does nothing at all.
export function PreviewCapture() {
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (!capturePreview(search)) return;
    const rest = new URLSearchParams(search);
    rest.delete('preview');
    const q = rest.toString();
    nav(pathname + (q ? `?${q}` : ''), { replace: true });
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps -- only when the address changes
  return null;
}
