import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Button, Container, cx } from './ui';
import Home from './pages/Home';
import Listing from './pages/Listing';
import AuthPage from './pages/AuthPage';
import Seller from './pages/Seller';
import Orders from './pages/Orders';

const Page = ({ children }) => <Container className="min-h-[70vh] py-10">{children}</Container>;

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) { const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 80); return () => clearTimeout(t); }
    window.scrollTo(0, 0);
  }, [hash, pathname]);
  return null;
}

function Brand({ className = '' }) {
  return <Link to="/" className={cx('font-display text-2xl font-extrabold text-white', className)}>Chop<span className="text-palm">Now</span></Link>;
}

function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const links = [
    ['/#how', 'How it works'], ['/#deals', 'Live deals'], ['/#sell', 'Sell with us'], ['/#faq', 'FAQ'],
    ...(user?.role === 'SELLER' ? [['/seller', 'My shop']] : []),
    ...(user?.role === 'BUYER' ? [['/orders', 'My orders']] : []),
  ];
  const auth = user
    ? <Button variant="palm" size="sm" onClick={() => { logout(); nav('/'); }}>Log out</Button>
    : <Button as={Link} to="/auth" variant="palm" size="sm">Log in or sign up</Button>;

  return (
    <header className={cx('sticky top-0 z-40 bg-leaf text-white transition-shadow', scrolled && 'shadow-lg shadow-black/20')}>
      <Container className="flex h-16 items-center justify-between">
        <Brand />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map(([to, t]) => <Link key={t} to={to} className="text-white/80 transition hover:text-white">{t}</Link>)}
          {auth}
        </nav>
        <button className="grid size-10 cursor-pointer place-items-center rounded-lg text-2xl hover:bg-white/10 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </Container>
      {open && (
        <nav className="grid gap-1 border-t border-white/10 px-5 pb-5 pt-3 md:hidden" aria-label="Mobile">
          {links.map(([to, t]) => <Link key={t} to={to} className="rounded-lg px-3 py-3 text-lg hover:bg-white/10">{t}</Link>)}
          <div className="mt-2 grid">{auth}</div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const col = 'grid content-start gap-2';
  const a = 'text-[#cfe0d6] transition hover:text-palm';
  return (
    <footer className="bg-leaf pt-14 text-sm text-[#cfe0d6]">
      <Container className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div><Brand /><p className="mt-3 max-w-xs">Good food at last-call prices, from Nigerian kitchens, bakeries, markets and shops. Less waste, more chop.</p></div>
        <div className={col}><b className="text-white">Buyers</b><Link className={a} to="/#how">How it works</Link><Link className={a} to="/#deals">Live deals</Link><Link className={a} to="/#faq">FAQ</Link></div>
        <div className={col}><b className="text-white">Sellers</b><Link className={a} to="/#sell">Why sell here</Link><Link className={a} to="/auth">Create a seller account</Link><Link className={a} to="/seller">My shop</Link></div>
        <div className={col}><b className="text-white">Food safety</b><p>Only buy food that looks, smells and is stored properly. Sellers are responsible for the food they list.</p></div>
      </Container>
      <div className="mt-12 border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} ChopNow. Made in Nigeria.</div>
    </footer>
  );
}

const NotFound = () => (
  <div className="grid place-items-center gap-3 py-24 text-center">
    <div className="text-7xl">🍽️</div>
    <h1 className="text-4xl font-extrabold">This plate is empty</h1>
    <p className="text-mute">We couldn't find that page.</p>
    <Button as={Link} to="/" className="mt-2">Back to live deals</Button>
  </div>
);

export default function App() {
  const { ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center bg-leaf font-display text-3xl font-extrabold text-white">Chop<span className="text-palm">Now</span></div>;
  return (
    <>
      <ScrollToHash />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<Page><Listing /></Page>} />
          <Route path="/auth" element={<Page><AuthPage /></Page>} />
          <Route path="/seller" element={<Page><Seller /></Page>} />
          <Route path="/orders" element={<Page><Orders /></Page>} />
          <Route path="*" element={<Page><NotFound /></Page>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
