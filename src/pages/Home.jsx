import { useNavigate } from "react-router-dom";
import LiveDealsTeaser from "../sections/LiveDealsTeaser";
import { Art } from "../components";
import { Reveal } from "../ui";
import { Section, Heading } from "../components/Section";
import { categoryImage } from "../config/market";
import Hero from "../sections/Hero";
import Why from "../sections/Why";
import Mission from "../sections/Mission";

const CATS = [
  ["Cooked meals", "Jollof, fried rice, egusi, pounded yam, rice and stew"],
  ["Bakery", "Bread, meat pie, doughnuts, cakes"],
  ["Fresh produce", "Tomatoes, pepper, ugu, plantain, vegetables"],
  ["Meat & fish", "Fresh fish, chicken, goat meat"],
  ["Dairy & drinks", "Yoghurt, fura da nono, zobo, milk"],
  ["Frozen foods", "Frozen chicken, turkey, fish"],
  ["Snacks & small chops", "Suya, puff puff, chin chin, samosa"],
  ["Groceries", "Rice, noodles, tinned and packaged items"],
];
const RULES = [
  [
    "At least 30% off",
    "Every listing must be a real discount, so buyers always get a proper deal.",
  ],
  [
    "Strict time limits",
    "The server enforces every sale end time. Nothing can be reserved after it.",
  ],
  [
    "No overselling",
    "If two people tap for the last pack at the same moment, only one gets it.",
  ],
  [
    "Pickup codes",
    "A handover is only confirmed with the buyer's code, so orders cannot be faked.",
  ],
  [
    "No-show protection",
    "Reservations not collected in time are tracked. After 3 no-shows, reserving is paused.",
  ],
  [
    "Private addresses",
    "Exact addresses are only shared with buyers who have reserved.",
  ],
];
export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* 1. HERO */}
      {/* 1. HERO */}
      <Hero
        onSearch={(city) =>
          navigate("/deals" + (city ? "?city=" + encodeURIComponent(city) : ""))
        }
      />
      {/* 2. WHY */}
      <Why />

      {/* MISSION */}
      {/* <Mission onJoin={() => go("deals")} /> */}
      <Mission onJoin={() => navigate("/deals")} />

      {/* 4. LIVE DEALS */}
      {/* 4. LIVE DEALS */}
      <LiveDealsTeaser />

      {/* 5. WHAT YOU CAN FIND */}
      <Section className="bg-white">
        <Heading
          title="What you can find"
          sub="From a hot plate of jollof to a bag of tomatoes. Tap a category to see what is live."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map(([c, ex], i) => (
            <Reveal key={c} delay={(i % 4) * 80}>
              <button
                onClick={() =>
                  navigate("/deals?category=" + encodeURIComponent(c))
                }
                className="group h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-paper text-left ring-[1.5px] ring-line transition hover:-translate-y-1 hover:ring-leaf"
              >
                <Art
                  c={c}
                  src={categoryImage[c]}
                  className="transition duration-300 group-hover:scale-105"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{c}</h3>
                  <p className="mt-1 text-sm text-mute">{ex}</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 7. TRUST */}
      <Section
        id="trust"
        className="bg-leaf bg-[radial-gradient(rgba(244,181,46,.14)_1.5px,transparent_1.5px)] bg-[length:24px_24px] text-white"
      >
        <Heading
          light
          title="Rules that keep it fair"
          sub="Built in from day one, so buyers and sellers can both trust the app."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <div className="h-full rounded-2xl border-l-4 border-palm bg-white/10 p-6">
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/80">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-palm p-6 text-[#2a1d00]">
          <b>Food safety comes first.</b> Sellers must be honest about when food
          was made and how it was stored. Buyers should check everything before
          paying, and skip anything that looks or smells wrong.
        </div>
      </Section>

    </>
  );
}
