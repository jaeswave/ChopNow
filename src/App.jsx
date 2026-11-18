import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { Button, Container, cx, tap, tapText, useToast } from "./ui";
import { api } from "./api";
import AppRoutes from "./app/AppRoutes";
import CityConfirm from "./components/CityConfirm";
import { yearLagos } from "./components/time";

// Optional ribbon for test versions: set VITE_BETA_NOTICE in Vercel to show it, leave it empty to hide it
const BETA = import.meta.env.VITE_BETA_NOTICE;

// Old links like /#how and /#sell (from before these became their own pages) still work
const LEGACY_HASHES = { "#how": "/how-it-works", "#faq": "/how-it-works", "#sell": "/sell-with-us" };
function LegacyHashRedirect() {
  const { pathname, hash } = useLocation();
  const nav = useNavigate();
  const to = pathname === "/" && LEGACY_HASHES[hash];
  useEffect(() => {
    if (to) nav(to, { replace: true });
  }, [to, nav]);
  return null;
}

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(
        () =>
          document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [hash, pathname]);
  return null;
}

function Brand({ className = "" }) {
  return (
    <Link
      to="/"
      className={cx(
        "font-display text-xl font-extrabold text-white min-[380px]:text-2xl",
        tapText,
        className,
      )}
    >
      Gbaan<span className="text-palm">Jo</span>
    </Link>
  );
}

const LiveLink = ({ compact = false }) => (
  <Link
    to="/deals"
    className={cx(
      "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white/10 font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20",
      tap,
      compact ? "px-3 py-1.5 text-sm" : "px-4 py-2",
    )}
  >
    <span className="relative flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-pepper opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-pepper" />
    </span>
    Live deals
  </Link>
);

// The same main links in the header, the phone menu and the footer
const MAIN_LINKS = [
  ["/deals", "Live deals"],
  ["/how-it-works", "How it works"],
  ["/sell-with-us", "Sell with us"],
];
// Where "My account" goes for each kind of user. Logged out: "Log in".
const ACCOUNT_HOME = { SELLER: "/seller", BUYER: "/orders", ADMIN: "/admin" };
const accountLink = (user) =>
  user ? [ACCOUNT_HOME[user.role] || "/", "My account"] : ["/auth", "Log in"];

function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const [accountTo, accountLabel] = accountLink(user);
  const signOut = () => {
    logout();
    nav("/");
  };
  const account = (
    <Button as={Link} to={accountTo} variant="palm" size="sm">
      {accountLabel}
    </Button>
  );
  const logOut = user && (
    <Button variant="link" size="sm" className="text-white hover:text-palm" onClick={signOut}>
      Log out
    </Button>
  );

  return (
    <header
      className={cx(
        "sticky top-0 z-40 bg-leaf text-white transition-shadow",
        scrolled && "shadow-lg shadow-black/20",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Brand />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          <LiveLink />
          {MAIN_LINKS.slice(1).map(([to, t]) => (
            <Link
              key={t}
              to={to}
              className={cx(tapText, "text-white/80 transition hover:text-white")}
            >
              {t}
            </Link>
          ))}
          {account}
          {logOut}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LiveLink compact />
          <button
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-2xl hover:bg-white/10"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </Container>
      {open && (
        <nav
          className="grid gap-2 border-t border-white/10 px-5 pb-5 pt-3 md:hidden"
          aria-label="Mobile"
        >
          {MAIN_LINKS.map(([to, t]) => (
            <Link
              key={t}
              to={to}
              className="rounded-lg px-3 py-3 text-lg hover:bg-white/10"
            >
              {t}
            </Link>
          ))}
          <div className="mt-2 grid gap-2">
            {account}
            {logOut}
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { user } = useAuth();
  const [accountTo, accountLabel] = accountLink(user);
  const col = "grid content-start gap-2";
  const a = cx(tapText, "text-[#cfe0d6] transition hover:text-palm");
  return (
    <footer className="bg-leaf pt-12 text-sm text-[#cfe0d6]">
      <Container className="grid gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-10">
        <div className="sm:col-span-2 md:col-span-1">
          <Brand />
          <p className="mt-3 max-w-xs">
            Good food at last-call prices from Lagos kitchens, bakeries,
            markets and shops. Less waste, more good food.
          </p>
        </div>
        <nav className={col} aria-label="Footer">
          <b className="text-white">GbaanJo</b>
          {MAIN_LINKS.map(([to, t]) => (
            <Link key={t} className={a} to={to}>
              {t}
            </Link>
          ))}
          <Link className={a} to={accountTo}>
            {accountLabel}
          </Link>
        </nav>
        <div className={col}>
          <b className="text-white">Help</b>
          <Link className={a} to="/terms">
            Terms and refunds
          </Link>
          <Link className={a} to="/feedback">
            Send us feedback
          </Link>
        </div>
        <div className={col}>
          <b className="text-white">Food safety</b>
          <p>
            Only buy food that looks, smells and is stored properly. Sellers are
            responsible for the food they list.
          </p>
        </div>
      </Container>
      <div className="mt-10 border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {yearLagos()} GbaanJo. Made in Nigeria.
      </div>
    </footer>
  );
}

function VerifyBanner() {
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!user || user.emailVerified || user.role === "ADMIN") return null;
  const resend = async () => {
    setBusy(true);
    try {
      await api("/auth/resend-verification", { method: "POST" });
      toast("Verification email sent. Check your inbox and spam folder.");
    } catch (e) {
      toast(e.message, "err");
    }
    setBusy(false);
  };
  return (
    <div className="bg-palm text-[#2a1d00]">
      <Container className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm font-semibold">
        <span>
          Please verify your email to{" "}
          {user.role === "SELLER" ? "start selling" : "order food"}. We sent you
          a link.
        </span>
        <button
          disabled={busy}
          onClick={resend}
          className={cx(tapText, "cursor-pointer underline")}
        >
          Resend email
        </button>
      </Container>
    </div>
  );
}

// A small button on every page while we are testing, so nobody has to hunt for a way to tell us what went wrong
function FeedbackPill() {
  const { pathname } = useLocation();
  if (/^\/(feedback|admin|pay)/.test(pathname)) return null;
  return (
    <Link
      to="/feedback"
      className={cx(tapText, "fixed bottom-4 right-4 z-30 rounded-full bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/25 ring-1 ring-white/20 transition hover:bg-ink")}
    >
      💬 Feedback
    </Link>
  );
}

export default function App() {
  const { ready } = useAuth();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center bg-leaf font-display text-3xl font-extrabold text-white">
        Gbaan<span className="text-palm">Jo</span>
      </div>
    );
  return (
    <>
      <LegacyHashRedirect />
      <ScrollToHash />
      {BETA && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs font-semibold text-white">
          {BETA}
        </div>
      )}
      <Navbar />
      <VerifyBanner />
      <main>
        <AppRoutes />
      </main>
      <Footer />
      <FeedbackPill />
      <CityConfirm />
    </>
  );
}
