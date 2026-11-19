import { useAuth } from '../auth';
import { comingSoonSwitch } from '../config/launch';
import usePreview from './usePreview';

// True when this person should see the coming soon site: the switch is on and they are a visitor or a buyer.
// Sellers and admins see everything as normal, so pilot partners can list and the team can test, and so does
// a browser unlocked with ?preview=<VITE_PREVIEW_CODE>.
export default function useComingSoon() {
  const { user } = useAuth() || {};
  const { unlocked } = usePreview();
  return comingSoonSwitch() && !unlocked && !['SELLER', 'ADMIN'].includes(user?.role);
}
