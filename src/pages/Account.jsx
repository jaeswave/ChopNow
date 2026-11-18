import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { InstallRow } from '../components/Install';
import usePageMeta from '../hooks/usePageMeta';
import { Button, cx, tap } from '../ui';

const box = 'rounded-2xl bg-white ring-[1.5px] ring-line';
const ROLE = { BUYER: 'Buyer', SELLER: 'Seller', ADMIN: 'Admin' };
const APPROVAL = { PENDING: 'Application under review', REJECTED: 'Application needs changes' };

// Shortcuts for each kind of user: [link, label, emoji]
const SHORTCUTS = {
  BUYER: [['/orders', 'My orders', '🧾'], ['/deals', 'Live deals', '🔥']],
  SELLER: [['/seller', 'My shop', '🏪'], ['/seller?tab=new', 'New listing', '➕'], ['/seller?tab=payouts', 'Payout account', '🏦'], ['/seller?tab=insights', 'Insights', '📈']],
  ADMIN: [['/admin', 'Admin', '🛡️'], ['/deals', 'Live deals', '🔥']],
};
const HELP = [['/how-it-works', 'How it works'], ['/sell-with-us', 'Sell with us'], ['/feedback', 'Send us feedback'], ['/terms', 'Terms and refunds']];

function LinkList({ items, label }) {
  return (
    <ul aria-label={label} className="grid gap-2">
      {items.map(([to, text, emoji]) => (
        <li key={to}>
          <Link to={to} className={cx(tap, box, 'flex items-center gap-3 px-4 py-3 font-semibold hover:ring-leaf focus-visible:outline-3 focus-visible:outline-palm')}>
            {emoji && <span aria-hidden="true" className="text-lg">{emoji}</span>}
            <span className="flex-1">{text}</span>
            <span aria-hidden="true" className="text-mute">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Account() {
  usePageMeta('Account');
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <h1 className="text-3xl font-extrabold">Account</h1>

      {user ? (
        <section aria-label="Your profile" className={cx(box, 'p-5')}>
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-leaf font-display text-2xl font-extrabold text-palm">
              {(user.businessName || user.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{user.role === 'SELLER' && user.businessName ? user.businessName : user.name}</p>
              <p className="text-sm text-mute">
                {ROLE[user.role] || user.role}
                {user.role === 'SELLER' && user.businessName && user.name ? ` · ${user.name}` : ''}
                {user.city ? ` · ${user.city}` : ''}
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            <li className={cx('rounded-full px-3 py-1', user.emailVerified ? 'bg-leaf/10 text-leaf' : 'bg-palm/30 text-[#7a5300]')}>
              {user.emailVerified ? '✓ Email verified' : 'Email not verified yet'}
            </li>
            {user.role === 'SELLER' && APPROVAL[user.approvalStatus] && (
              <li className="rounded-full bg-palm/30 px-3 py-1 text-[#7a5300]">{APPROVAL[user.approvalStatus]}</li>
            )}
          </ul>
        </section>
      ) : (
        <section aria-label="Log in" className={cx(box, 'p-5')}>
          <p className="text-xl font-bold">You are not logged in</p>
          <p className="mt-1 text-mute">Log in to order deals, see your pickup codes or manage your shop.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button as={Link} to="/auth">Log in</Button>
            <Button as={Link} to="/auth?mode=register" variant="outline">Create an account</Button>
          </div>
        </section>
      )}

      {user && SHORTCUTS[user.role] && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-mute">Shortcuts</h2>
          <LinkList items={SHORTCUTS[user.role]} label="Shortcuts" />
        </section>
      )}

      <section className={cx(box, 'p-4')}>
        <InstallRow />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-mute">Help</h2>
        <LinkList items={HELP} label="Help" />
      </section>

      {user && (
        <Button
          variant="outline"
          onClick={() => {
            logout();
            nav('/');
          }}
        >
          Log out
        </Button>
      )}
    </div>
  );
}
