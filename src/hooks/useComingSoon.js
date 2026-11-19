import { useAuth } from '../auth';
import { comingSoonSwitch } from '../config/launch';

// True when this person should see the coming soon site: the switch is on and they are a visitor or a buyer.
// Sellers and admins see everything as normal, so pilot partners can list and the team can test.
export default function useComingSoon() {
  const { user } = useAuth() || {};
  return comingSoonSwitch() && !['SELLER', 'ADMIN'].includes(user?.role);
}
