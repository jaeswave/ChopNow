import { useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "../../components/Section";
import { Button } from "../../ui";
import MockCard from "./MockCard";
import { FACTS, FOODS } from "./hero.data";

// cities: list for the dropdown. onSearch(city): called when the visitor presses "Find deals near me".
export default function Hero({ cities = [], onSearch }) {
  const [city, setCity] = useState("");

  return (
    <Section className="overflow-hidden bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white">
      <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-palm">
            Build for kitchens, bakeries and markets
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
            Surprise your taste buds, not your wallet — 30% off or more.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85 sm:text-xl">
            Kitchens, bakeries, markets and shops list what they cannot sell
            today. You pay online, get a pickup code, and collect it. Every deal
            is at least 30% off.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.("Lagos");
            }}
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 sm:flex-row"
          >
            <div className="flex min-h-12 flex-1 items-center gap-2 rounded-xl px-4 text-ink">
              <span aria-hidden="true">📍</span>
              <span className="font-semibold">Lagos</span>
              <span className="ml-auto rounded-full bg-palm/20 px-2 py-0.5 text-xs font-bold text-[#7a5300]">
                Launch city
              </span>
            </div>
            <Button size="lg" className="sm:!px-6">
              Find deals near me
            </Button>
          </form>

          {/* <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.(city);
            }}
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 sm:flex-row"
          >
            <select
              aria-label="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="min-h-12 flex-1 cursor-pointer rounded-xl bg-transparent px-4 text-ink outline-none"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Button size="lg" className="sm:!px-6">
              Find deals near me
            </Button>
          </form> */}
          <p className="mt-4 text-sm text-white/70">
            Want to sell instead?{" "}
            <Link
              to="/auth"
              className="font-bold text-palm underline underline-offset-4"
            >
              Start a seller account
            </Link>
          </p>
        </div>

        <div
          className="relative mx-auto hidden h-[470px] w-full max-w-md sm:block"
          aria-hidden="true"
        >
          <MockCard
            className="absolute right-0 top-0 w-80 rotate-3 animate-float"
            cat="Cooked meals"
            size="lg"
            tone="hot"
            time="1h 12m left"
            title="Party jollof and chicken, 10 packs"
            sub="Example listing · Lekki Phase 1"
            price="₦2,500"
            was="₦6,000"
            off="58% off"
          />
          <MockCard
            className="absolute bottom-0 left-0 w-60 -rotate-6 animate-float [animation-delay:-3s]"
            cat="Bakery"
            size="md"
            tone="palm"
            time="3h 05m left"
            title="Fresh bread, 12 loaves"
            price="₦700"
            was="₦1,500"
          />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 md:grid-cols-4">
        {FACTS.map(([n, t]) => (
          <div key={t}>
            <div className="font-display text-4xl font-extrabold text-palm">
              {n}
            </div>
            <p className="text-sm text-white/75">{t}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {FOODS.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90"
          >
            {t}
          </span>
        ))}
      </div>
    </Section>
  );
}
