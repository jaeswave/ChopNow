import { Link } from "react-router-dom";
import { Card, CardSkeleton } from "../../components";
import { Section } from "../../components/Section";
import { Button, Spinner } from "../../ui";
import useListings from "../../hooks/useListings";

// Two example deals plus a link to the full page
export default function LiveDealsTeaser() {
  const { items, failed, waking, reload } = useListings({}, { limit: 2 });

  return (
    <Section id="live-deals" compact>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            Live now
          </h2>
          <p className="mt-2 text-lg text-mute">
            A taste of what is on sale near you.
          </p>
        </div>
        <Button as={Link} to="/deals" variant="outline">
          See all deals
        </Button>
      </div>

      {waking && !failed && items === null && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-palm/25 p-4 font-semibold">
          <Spinner /> Waking up the server. The first load can take up to a
          minute…
        </div>
      )}
      {failed && (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-[1.5px] ring-pepper/40">
          <p className="text-xl font-bold text-pepper">Something went wrong</p>
          <p className="mx-auto mt-1 max-w-md text-mute">
            We could not load the deals. Please try again.
          </p>
          <Button className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      )}
      {!failed && items && items.length === 0 && (
        <p className="mt-8 rounded-2xl bg-white p-8 text-center text-mute ring-[1.5px] ring-line">
          No deals are live right now. Check back soon.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items === null && [0, 1].map((i) => <CardSkeleton key={i} />)}
        {items?.map((l) => (
          <Card key={l.id} l={l} />
        ))}
        {items && items.length > 0 && (
          <Link
            to="/deals"
            className="grid min-h-48 place-content-center gap-2 rounded-2xl bg-leaf p-6 text-center text-white transition hover:bg-leaf-2"
          >
            <span className="text-4xl">→</span>
            <b className="text-xl">See all live deals</b>
          </Link>
        )}
      </div>
    </Section>
  );
}
