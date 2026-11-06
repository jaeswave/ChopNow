import { useEffect, useState } from "react";
import { api, download } from "../api";
import { Button, Chip, Spinner, cx, useToast } from "../ui";
import { naira } from "./index";

const box = "rounded-2xl bg-white p-5 ring-[1.5px] ring-line";
const show = (v) => (v === null || v === undefined ? "–" : v + "%");
const hour = (h) => {
  const f = (n) => (n % 12 === 0 ? 12 : n % 12) + (n < 12 ? "am" : "pm");
  return f(h) + " to " + f((h + 1) % 24);
};

const Card = ({ label, value, sub, tone = "" }) => (
  <div className={cx(box, "p-4")}>
    <p className="text-sm text-mute">{label}</p>
    <p className={cx("font-display text-3xl font-extrabold", tone)}>{value}</p>
    {sub && <p className="mt-1 text-xs text-mute">{sub}</p>}
  </div>
);
const Bar = ({ value, tone = "bg-leaf" }) => (
  <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper">
    <div
      className={cx("h-full rounded-full", tone)}
      style={{ width: Math.max(0, Math.min(100, value ?? 0)) + "%" }}
    />
  </div>
);

/* The screen itself. It only draws what it is given, so it is easy to test. */
export function InsightsView({ d }) {
  const max = Math.max(1, ...d.byDay.map((x) => x.revenue));
  const bestBand = d.byDiscount
    .filter((b) => b.listings >= 3 && b.sellThrough !== null)
    .sort((a, b) => b.sellThrough - a.sellThrough)[0];
  return (
    <div className="grid gap-4">
      {d.sample.orders < 10 && (
        <p className="rounded-xl bg-palm/20 p-3 text-sm">
          Early days: with only {d.sample.orders} paid order
          {d.sample.orders === 1 ? "" : "s"} so far, patterns below can mislead.
          They become reliable after a few weeks of selling.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          label="Recovered revenue"
          value={naira(d.revenue.recovered)}
          sub={d.revenue.units + " portions, after fees"}
          tone="text-leaf"
        />
        <Card
          label="Sell-through"
          value={show(d.listings.sellThrough)}
          sub={
            d.listings.offered -
            d.listings.unsold +
            " of " +
            d.listings.offered +
            " portions on finished listings"
          }
        />
        <Card
          label="No-show rate"
          value={show(d.pickup.noShowRate)}
          sub={
            d.pickup.noShows +
            " missed pickup" +
            (d.pickup.noShows === 1 ? "" : "s") +
            ", " +
            d.pickup.refunded +
            " refunded"
          }
          tone={d.pickup.noShowRate > 15 ? "text-pepper" : ""}
        />
        <Card
          label="Left unsold"
          value={d.listings.unsold + " portions"}
          sub={naira(d.listings.unsoldRetailValue) + " at normal prices"}
        />
      </div>

      <section className={box}>
        <h3 className="text-lg font-extrabold">Money recovered each day</h3>
        <div
          className="mt-3 flex h-32 items-end gap-px"
          role="img"
          aria-label={"Revenue per day over the last " + d.days + " days"}
        >
          {d.byDay.map((x) => (
            <div
              key={x.date}
              title={x.date + ": " + naira(x.revenue)}
              className="flex h-full flex-1 items-end"
            >
              <div
                className={cx(
                  "w-full rounded-t",
                  x.revenue ? "bg-leaf" : "bg-paper",
                )}
                style={{
                  height: x.revenue
                    ? Math.max(4, (x.revenue / max) * 100) + "%"
                    : "2px",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-mute">
          <span>{d.byDay[0]?.date}</span>
          <span>{d.byDay[d.byDay.length - 1]?.date}</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={box}>
          <h3 className="text-lg font-extrabold">What sells best</h3>
          {d.topItems.length === 0 ? (
            <p className="mt-2 text-sm text-mute">
              Nothing sold in this period yet.
            </p>
          ) : (
            <ol className="mt-3 grid gap-2">
              {d.topItems.map((t, i) => (
                <li
                  key={t.title}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    <b>{i + 1}.</b> {t.title}
                  </span>
                  <span className="shrink-0 text-mute">
                    {t.units} sold · {naira(t.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className={box}>
          <h3 className="text-lg font-extrabold">Which discount works</h3>
          {d.byDiscount.length === 0 ? (
            <p className="mt-2 text-sm text-mute">
              Shows once you have finished listings.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {d.byDiscount.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-sm">
                    <span>
                      {b.name}{" "}
                      <span className="text-mute">
                        ({b.listings} listing{b.listings === 1 ? "" : "s"})
                      </span>
                    </span>
                    <b>{show(b.sellThrough)} sold</b>
                  </div>
                  <Bar value={b.sellThrough} />
                </div>
              ))}
            </div>
          )}
          {bestBand && (
            <p className="mt-3 text-sm text-mute">
              So far <b className="text-ink">{bestBand.name}</b> sells best for
              you ({bestBand.sellThrough}% of portions). Keep watching as more
              data comes in.
            </p>
          )}
        </section>
        <section className={box}>
          <h3 className="text-lg font-extrabold">When customers pay</h3>
          {d.bestHours.length === 0 ? (
            <p className="mt-2 text-sm text-mute">
              Shows after your first sales.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 text-sm">
              {d.bestHours.map((h) => (
                <li key={h.hour} className="flex justify-between">
                  <span>{hour(h.hour)}</span>
                  <b>
                    {h.count} order{h.count === 1 ? "" : "s"}
                  </b>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-mute">
            Lagos time. Listing just before your busiest hour can help.
          </p>
        </section>
        <section className={box}>
          <h3 className="text-lg font-extrabold">By category</h3>
          {d.byCategory.length === 0 ? (
            <p className="mt-2 text-sm text-mute">
              Shows once you have finished listings.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {d.byCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-mute">
                      {naira(c.revenue)} ·{" "}
                      <b className="text-ink">{show(c.sellThrough)}</b> sold
                    </span>
                  </div>
                  <Bar value={c.sellThrough} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-mute">
        Based on {d.sample.orders} paid orders and {d.sample.listings} finished
        listings from the last {d.days} days. 'Left unsold' is food from
        finished listings that nobody bought. Full waste tracking comes with
        inventory.
      </p>
    </div>
  );
}

export default function SellerInsights() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [dl, setDl] = useState(false);
  useEffect(() => {
    setD(null);
    setErr("");
    api("/insights/summary?days=" + days)
      .then(setD)
      .catch((e) => setErr(e.message));
  }, [days]);
  const csv = async () => {
    setDl(true);
    try {
      await download("/insights/sales.csv?days=" + days, "gbaanjo-sales.csv");
    } catch (e) {
      toast(e.message, "err");
    }
    setDl(false);
  };
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((n) => (
          <Chip key={n} on={days === n} onClick={() => setDays(n)}>
            Last {n} days
          </Chip>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={dl}
          onClick={csv}
        >
          {dl ? <Spinner /> : "Download sales (CSV)"}
        </Button>
      </div>
      <div className="mt-4">
        {err && (
          <p
            role="alert"
            className="rounded-xl bg-pepper/10 p-3 font-medium text-pepper"
          >
            {err}
          </p>
        )}
        {!d && !err && (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        )}
        {d && <InsightsView d={d} />}
      </div>
    </div>
  );
}
