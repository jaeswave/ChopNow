import { useEffect, useState } from 'react';
import { api } from '../api';
import { Container, cx } from '../ui';

// Live numbers from GET /public/stats. A number is shown only when it is above zero, so we never show a "0".
const LABELS = [
  ['liveListings', 'deals live now'],
  ['mealsRescued', 'meals rescued'],
  ['businesses', 'food businesses'],
];
const fmt = new Intl.NumberFormat('en-NG');

export default function StatsStrip() {
  const [stats, setStats] = useState(null); // null while loading, false if it failed
  useEffect(() => {
    let live = true;
    api('/public/stats').then((s) => live && setStats(s)).catch(() => live && setStats(false));
    return () => { live = false; };
  }, []);

  if (stats === false) return null; // no data: show nothing rather than guess
  const shown = stats ? LABELS.filter(([k]) => Number(stats[k]) > 0) : [];

  return (
    <section aria-label="GbaanJo in numbers" className="border-b border-line bg-white">
      <Container className="min-h-[4.5rem] py-3">
        {stats === null && <div className="h-12 animate-pulse rounded-xl bg-line/60" />}
        {stats && shown.length > 0 && (
          <dl className={cx('grid items-end gap-2 text-center', ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'][shown.length])}>
            {shown.map(([k, label]) => (
              <div key={k} className="flex flex-col-reverse">
                <dt className="text-sm text-mute">{label}</dt>
                <dd className="font-display text-2xl font-extrabold text-leaf sm:text-3xl">{fmt.format(stats[k])}</dd>
              </div>
            ))}
          </dl>
        )}
        {stats && shown.length === 0 && (
          <p className="py-2 text-center font-semibold">We are just getting started in Lagos. Be one of the first to grab a deal.</p>
        )}
      </Container>
    </section>
  );
}
