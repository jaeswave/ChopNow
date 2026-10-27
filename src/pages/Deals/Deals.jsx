import { Link, useSearchParams } from "react-router-dom";
import { ART, Card, CardSkeleton } from "../../components";
import { Button, Chip, Input, Select, Spinner } from "../../ui";
import { useMeta } from "../../hooks/useMeta";
import useListings from "../../hooks/useListings";

export default function Deals() {
  const { cities, categories } = useMeta();
  const [params, setParams] = useSearchParams();
  // The filters live in the address (/deals?city=Lagos&category=Bakery) so a link or a refresh keeps them
  const f = {
    city: params.get("city") || "",
    category: params.get("category") || "",
    q: params.get("q") || "",
  };
  const change = (patch) =>
    setParams(
      Object.fromEntries(
        Object.entries({ ...f, ...patch }).filter(([, v]) => v),
      ),
      { replace: true },
    );
  const { items, failed, waking, reload } = useListings(f);
  const filtered = f.city || f.category || f.q;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Live deals</h1>
          <p className="mt-2 text-lg text-mute">
            Limited-time deals from sellers near you. Ending soonest first.
          </p>
        </div>
        {items && !failed && (
          <p className="font-semibold text-mute">
            {items.length} deal{items.length === 1 ? "" : "s"} live
            {filtered ? " with these filters" : ""}
          </p>
        )}
      </div>

      <div className="sticky top-16 z-20 -mx-5 mt-6 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap gap-3">
          <Select
            className="sm:w-48"
            aria-label="City"
            value={f.city}
            onChange={(e) => change({ city: e.target.value })}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Input
            className="min-w-56 flex-1"
            aria-label="Search"
            placeholder="Search for a deal…"
            value={f.q}
            onChange={(e) => change({ q: e.target.value })}
          />
          {filtered && (
            <Button
              variant="outline"
              onClick={() => setParams({}, { replace: true })}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["", ...categories].map((c) => (
            <Chip
              key={c}
              on={f.category === c}
              onClick={() => change({ category: c })}
              className="shrink-0"
            >
              {ART[c] ? ART[c][0] + " " : ""}
              {c || "Everything"}
            </Chip>
          ))}
        </div>
      </div>

      {waking && !failed && items === null && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-palm/25 p-4 font-semibold">
          <Spinner /> Waking up the server. The first load can take up to a
          minute…
        </div>
      )}
      {failed && (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-[1.5px] ring-pepper/40">
          <div className="text-5xl">😕</div>
          <p className="mt-3 text-xl font-bold text-pepper">
            Something went wrong
          </p>
          <p className="mx-auto mt-1 max-w-md text-mute">
            We could not load the deals. The server may still be waking up,
            which can take up to a minute. Please try again.
          </p>
          <Button className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      )}
      {!failed && items && items.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-[1.5px] ring-line">
          <div className="text-6xl">🍽️</div>
          <p className="mt-3 text-xl font-bold">Nothing live here right now</p>
          <p className="mx-auto mt-1 max-w-md text-mute">
            Try another city or category, or check back later. New deals are
            added through the day.
          </p>
          <Button as={Link} to="/auth" className="mt-5">
            Are you a seller? List something
          </Button>
        </div>
      )}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items === null &&
          Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
        {items?.map((l) => (
          <Card key={l.id} l={l} />
        ))}
      </div>
    </div>
  );
}
