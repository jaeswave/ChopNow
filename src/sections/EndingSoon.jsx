import { Link } from 'react-router-dom';
import { Card, CardSkeleton } from '../components';
import useListings from '../hooks/useListings';
import { Container, cx, tapText } from '../ui';

// The deals that end soonest (the server sorts live listings by end time). Hidden when there are none.
export default function EndingSoon() {
  const { items, failed } = useListings({}, { limit: 4 });
  if (failed || (items && items.length === 0)) return null;

  return (
    <section aria-labelledby="soon-title">
      <Container className="py-6">
        <div className="flex items-end justify-between gap-3">
          <h2 id="soon-title" className="text-xl font-extrabold sm:text-3xl">Ending soon</h2>
          <Link to="/deals" className={cx(tapText, 'font-semibold text-leaf underline underline-offset-4')}>See all deals</Link>
        </div>
        {/* min-h: the same height as a real card, so nothing jumps when the deals arrive */}
        <ul className="-mx-5 mt-3 flex min-h-[21.5rem] snap-x gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
          {(items || [0, 1]).map((l, i) => (
            <li key={l?.id ?? i} className="flex w-64 shrink-0 snap-start">
              {items ? <Card l={l} /> : <div className="w-full"><CardSkeleton /></div>}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
