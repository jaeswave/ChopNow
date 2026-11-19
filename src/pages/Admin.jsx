import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { Chip } from '../ui';
import usePageMeta from '../hooks/usePageMeta';
import Applications from './admin/Applications';
import Feedback from './admin/Feedback';
import Listings from './admin/Listings';
import Overview from './admin/Overview';
import Payouts from './admin/Payouts';
import Refunds from './admin/Refunds';
import Users from './admin/Users';

// Admin area. Only ADMIN users get past the check below; everyone else is sent home.
// The open tab is in the URL (/admin?tab=users), so links can open a screen directly.
export const ADMIN_TABS = [
  ['applications', 'Seller applications', Applications],
  ['overview', 'Overview', Overview],
  ['refunds', 'Refunds', Refunds],
  ['payouts', 'Seller payouts', Payouts],
  ['users', 'Users', Users],
  ['listings', 'Listings', Listings],
  ['feedback', 'Feedback', Feedback],
];

export default function Admin() {
  usePageMeta('Admin');
  const { user } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ADMIN_TABS.find(([k]) => k === params.get('tab')) || ADMIN_TABS[0];
  const Screen = tab[2];
  useEffect(() => { if (user?.role !== 'ADMIN') nav('/'); }, [user]);
  if (user?.role !== 'ADMIN') return null;
  return (
    <div>
      <h1 className="text-4xl font-extrabold">Admin</h1>
      <p className="mt-1 text-mute">Keep GbaanJo safe and fair.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {ADMIN_TABS.map(([k, t]) => <Chip key={k} on={tab[0] === k} onClick={() => setParams({ tab: k })}>{t}</Chip>)}
      </div>
      <Screen key={tab[0]} />
    </div>
  );
}
