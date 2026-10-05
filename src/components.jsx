import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cx } from './ui';

export const naira = (n) => '₦' + Number(n).toLocaleString('en-NG');
export const pctOff = (o, p) => Math.round((1 - p / o) * 100);
export const when = (d) => new Date(d).toLocaleString('en-NG', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
export const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

/* Emoji + colour per category, so listings look good even without photos. */
export const ART = {
  'Cooked meals': ['🍛', '#F9D9A8'], 'Bakery': ['🍞', '#F6E3B4'], 'Fresh produce': ['🍅', '#CFE8C2'],
  'Meat & fish': ['🐟', '#CFE3EE'], 'Dairy & drinks': ['🥛', '#E4E9F5'], 'Frozen foods': ['🧊', '#D6ECF2'],
  'Snacks & small chops': ['🍢', '#F7D5C4'], 'Groceries': ['🛒', '#E2E8D0'],
};
const ART_SIZE = { sm: 'size-16 shrink-0 rounded-xl text-3xl', md: 'h-36 text-6xl', lg: 'h-48 rounded-2xl text-8xl', xl: 'h-64 rounded-3xl text-9xl sm:h-80' };
export function Art({ c, size = 'md', className = '' }) {
  const [emoji, bg] = ART[c] || ['🍽️', '#E8EDE4'];
  return (
    <div className={cx('relative grid place-items-center overflow-hidden', ART_SIZE[size], className)} style={{ background: bg }}>
      <span className="absolute -right-8 -top-8 size-32 rounded-full bg-white/35" />
      <span className="absolute -bottom-10 -left-6 size-28 rounded-full bg-white/20" />
      <span className="relative drop-shadow-sm">{emoji}</span>
    </div>
  );
}

/* The market price-tag, used for countdowns. */
const TAG = {
  palm: 'bg-palm text-[#2a1d00] before:ring-[#2a1d00]',
  hot: 'bg-pepper text-white before:ring-white',
  over: 'bg-line text-mute before:ring-mute',
};
export function Tag({ tone = 'palm', children, className = '' }) {
  return (
    <span className={cx("relative inline-block rounded-[4px_14px_14px_4px] py-1 pl-6 pr-3 text-[.85rem] font-bold tabular-nums before:absolute before:left-[9px] before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:bg-white before:ring-[1.5px]", TAG[tone], className)}>
      {children}
    </span>
  );
}

/* One shared clock for every countdown on the page. */
const subs = new Set();
let timer = null;
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    subs.add(setNow);
    if (!timer) timer = setInterval(() => subs.forEach((f) => f(Date.now())), 1000);
    return () => { subs.delete(setNow); if (!subs.size) { clearInterval(timer); timer = null; } };
  }, []);
  return now;
}

// Display only. The server decides what has actually expired.
export function Countdown({ to, className }) {
  const ms = new Date(to) - useNow();
  if (ms <= 0) return <Tag tone="over" className={className}>Sale ended</Tag>;
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  return <Tag tone={ms < 36e5 ? 'hot' : 'palm'} className={className}>{h > 0 ? h + 'h ' : ''}{m}m {String(s).padStart(2, '0')}s left</Tag>;
}

const BADGE = {
  RESERVED: ['Reserved', 'bg-palm/30 text-[#7a5300]'], PICKED_UP: ['Picked up', 'bg-leaf/10 text-leaf'],
  EXPIRED: ['Missed', 'bg-line text-mute'], CANCELLED: ['Cancelled', 'bg-line text-mute'],
  ACTIVE: ['Live', 'bg-leaf/10 text-leaf'], SOLD_OUT: ['Sold out', 'bg-pepper/10 text-pepper'],
};
export function StatusBadge({ s, listing }) {
  const [label, tone] = BADGE[s] || [s, 'bg-line text-mute'];
  return <span className={cx('rounded-full px-3 py-1 text-xs font-bold', tone)}>{listing && s === 'EXPIRED' ? 'Ended' : label}</span>;
}

export function Card({ l }) {
  const claimed = l.quantity - l.quantityLeft;
  return (
    <Link to={'/listing/' + l.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-[1.5px] ring-line transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-leaf/10 hover:ring-leaf focus-visible:outline-3 focus-visible:outline-palm">
      <div className="relative">
        <Art c={l.category} className="transition duration-300 group-hover:scale-105" />
        <div className="absolute left-3 top-3"><Countdown to={l.saleEndsAt} /></div>
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-pepper px-2.5 py-0.5 text-sm font-extrabold text-white">{pctOff(l.originalPrice, l.price)}% off</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold leading-tight">{l.title}</h3>
        <p className="mt-1 text-sm text-mute">{l.seller.businessName} · {l.area}, {l.city}</p>
        <div className="mt-3 flex items-baseline gap-2.5">
          <strong className="font-display text-2xl">{naira(l.price)}</strong>
          <s className="text-mute">{naira(l.originalPrice)}</s>
        </div>
        <div className="mt-auto pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-pepper" style={{ width: Math.round((claimed / l.quantity) * 100) + '%' }} /></div>
          <p className="mt-1.5 flex justify-between text-sm">
            {l.quantityLeft <= 3 ? <b className="text-pepper">Only {l.quantityLeft} left</b> : <span className="text-mute">{l.quantityLeft} left</span>}
            <span className="text-mute">{claimed} claimed</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export const CardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl bg-white ring-[1.5px] ring-line">
    <div className="h-36 bg-line/70" />
    <div className="grid gap-3 p-4"><div className="h-5 w-3/4 rounded bg-line/70" /><div className="h-4 w-1/2 rounded bg-line/70" /><div className="h-7 w-1/3 rounded bg-line/70" /></div>
  </div>
);
