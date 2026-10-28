import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LiveDealsTeaser from "../sections/LiveDealsTeaser";
import { api } from "../api";
import { Art, ART, Card, CardSkeleton, Tag, naira } from "../components";
import {
  Button,
  Chip,
  Container,
  Input,
  Reveal,
  Select,
  Spinner,
  cx,
} from "../ui";
import { Section, Heading } from "../components/Section";
import { categoryImage } from "../config/market";
import Hero from "../sections/Hero";
import Why from "../sections/Why";
import Mission from "../sections/Mission";

const BUYER_STEPS = [
  [
    "Find a deal",
    "Choose your city and see what is live, sorted by what ends soonest.",
  ],
  [
    "Pay online first",
    "Choose how many (up to 5) and pay securely online. Your food is held while you pay.",
  ],
  [
    "Get your order number and code",
    "You get an order number, a 6-digit pickup code, and the exact address.",
  ],
  [
    "Collect it, or send a friend",
    "Show the code to the seller. Anyone with your code can collect for you.",
  ],
];
const SELLER_STEPS = [
  [
    "Apply with your CAC number",
    "Sign up, verify your email and give us your RC or BN number so we can check your business.",
  ],
  [
    "Get approved",
    "Once we confirm your registration, you can add your payout account and upload food photos.",
  ],
  [
    "List your surplus",
    "Add the food, the price, how many, and when the sale ends. GbaanJo takes a 10% fee only when you sell.",
  ],
  [
    "Hand over with a code",
    "The customer shows a 6-digit code. Type it in, check the order, and confirm.",
  ],
];
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
const FAQ = [
  [
    "How do I pay?",
    "Securely online when you reserve, using the payment options shown at checkout. Your food is held for a few minutes while you pay.",
  ],
  [
    "What if I cannot make it?",
    "Cancel from My orders before the sale ends and you get a refund while the food goes back for someone else. Once the sale has ended the order stays with the seller, so please make it.",
  ],
  [
    "What can be sold here?",
    "Cooked meals, bakery items, fresh produce, meat and fish, dairy and drinks, frozen foods, small chops and groceries close to the end of their selling window.",
  ],
  [
    "Is the food safe?",
    "Sellers are responsible for what they list and should be honest about when it was made and how it was stored. Buyers should check food before paying and skip anything that looks or smells wrong.",
  ],
  [
    "How long can a listing run?",
    "From 15 minutes up to 72 hours. Buyers then have up to 24 hours after the sale ends to collect.",
  ],
  [
    "What if the seller cancels?",
    "Your order is cancelled and you are refunded. You will see it in My orders.",
  ],
  [
    "How much does it cost to sell?",
    "Listing is free. GbaanJo takes a 10% fee on each sale, and we pay the rest to your bank account.",
  ],
  [
    "How do I start selling?",
    "Create a seller account with your business name and CAC number (RC or BN), and verify your email. After we approve your application you can add payout details, upload photos and publish your first listing.",
  ],
  [
    "Why do sellers need a CAC number?",
    "It lets us confirm that every seller is a registered business before they sell food to the public. This keeps buyers safe and builds trust.",
  ],
  [
    "Can someone else collect my order?",
    "Yes. After you pay, you get a pickup code. Send it to anyone you trust and they can collect the food by showing it. Only share it with people you trust, because whoever shows the code gets the food.",
  ],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("buyers");
  const steps = tab === "buyers" ? BUYER_STEPS : SELLER_STEPS;

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

      {/* 3. HOW IT WORKS */}
      <Section id="how" className="bg-white">
        <Reveal className="text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl">
            How GbaanJo works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-mute">
            Four simple steps, whether you are hungry or have food to move.
          </p>
          <div className="mt-6 inline-flex gap-2 rounded-full bg-paper p-1.5">
            {[
              ["buyers", "I want to buy"],
              ["sellers", "I want to sell"],
            ].map(([k, t]) => (
              <Chip
                key={k}
                on={tab === k}
                onClick={() => setTab(k)}
                className="!ring-0"
              >
                {t}
              </Chip>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <ol key={tab} className="grid gap-8">
            {steps.map(([t, d], i) => (
              <li
                key={t}
                className="relative pl-16 before:absolute before:left-6 before:top-14 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-line last:before:hidden"
              >
                <span className="absolute left-0 top-0 grid size-12 place-items-center rounded-full bg-leaf font-display text-xl font-extrabold text-palm">
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-1 text-mute">{d}</p>
              </li>
            ))}
          </ol>

          <div
            className="mx-auto w-full max-w-sm rounded-[2rem] bg-paper p-5 ring-[1.5px] ring-line"
            aria-hidden="true"
          >
            {tab === "buyers" ? (
              <div className="grid gap-3">
                <p className="text-sm text-mute">Example reservation</p>
                <b>2 × Party jollof and chicken</b>
                <p className="text-sm text-mute">
                  Mama Tee Kitchen · ₦5,000 paid
                </p>
                <div className="rounded-xl bg-leaf p-4 text-white">
                  <span className="text-sm">Show this code to the seller</span>
                  <div className="font-display text-4xl font-extrabold tracking-[.2em] text-palm">
                    482917
                  </div>
                </div>
                <p className="text-sm">
                  Collect by <b>Sat 8:30 pm</b>. The exact address shows after
                  you reserve.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm text-mute">
                  Example reservation on your dashboard
                </p>
                <b>2 × Party jollof and chicken</b>
                <p className="text-sm text-mute">
                  Chioma A. · ₦5,000 · collect by Sat 8:30 pm
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl border-[1.5px] border-line bg-white px-4 py-3 text-mute">
                    6-digit code
                  </div>
                  <span className="grid place-items-center rounded-xl bg-pepper px-4 text-sm font-bold text-white">
                    Confirm
                  </span>
                </div>
                <p className="text-sm text-mute">
                  Match the buyer's code to hand over safely.
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

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

      {/* 6. FOR SELLERS */}
      <Section id="sell" className="bg-palm text-[#2a1d00]">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Cooking too much? Stock not moving?
            </h2>
            <p className="mt-5 max-w-lg text-lg">
              Turn tonight's surplus into money instead of waste. Listing is
              free and takes about two minutes. GbaanJo only takes a 10% fee
              when you make a sale, and we pay the rest to your bank account.
            </p>
            <ul className="mt-6 grid gap-2 font-semibold sm:grid-cols-2">
              {[
                "Restaurants and mama put",
                "Bakeries and pastry shops",
                "Caterers after events",
                "Supermarkets and mini-marts",
                "Fish, meat and produce sellers",
                "Market traders",
              ].map((w) => (
                <li key={w} className="rounded-lg bg-white/55 px-4 py-2.5">
                  {w}
                </li>
              ))}
            </ul>
            <Button
              as={Link}
              to="/auth"
              variant="leaf"
              size="lg"
              className="mt-8"
            >
              Start selling
            </Button>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-3xl bg-white p-6 text-ink shadow-xl sm:p-8">
              <p className="text-sm font-medium text-mute">
                Example only: one evening's surplus
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  ["Party jollof packs left over", "10 packs"],
                  ["Normal price", "₦6,000 each"],
                  ["Your last-call price", "₦2,500 each"],
                  ["Packs sold", "8 packs"],
                  ["GbaanJo fee (10%)", "− ₦2,000"],
                ].map(([a, b]) => (
                  <div
                    key={a}
                    className="flex justify-between border-b border-line pb-3"
                  >
                    <span className="text-mute">{a}</span>
                    <b>{b}</b>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-mute">
                Paid to your bank account after the fee
              </p>
              <p className="font-display text-5xl font-extrabold text-leaf">
                ₦18,000
              </p>
            </div>
          </Reveal>
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

      {/* 8. FAQ + FINAL CTA */}
      <Section id="faq">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <Heading title="Questions" sub="Quick answers before you start." />
            <div className="mt-8 grid gap-3">
              {FAQ.map(([q, a]) => (
                <details
                  key={q}
                  className="group rounded-xl bg-white p-4 ring-[1.5px] ring-line transition open:ring-leaf"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="text-leaf transition group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <p className="mt-2 text-mute">{a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="self-center rounded-3xl bg-leaf p-8 text-white shadow-xl shadow-leaf/20">
            <h2 className="text-3xl font-extrabold">
              Ready to save good food?
            </h2>
            <p className="mt-3 text-white/80">
              Join as a buyer to grab deals near you, or as a seller to turn
              surplus into cash.
            </p>
            <div className="mt-6 grid gap-3">
              <Button
                variant="palm"
                size="lg"
                onClick={() => navigate("/deals")}
              >
                See live deals
              </Button>
              <Button as={Link} to="/auth" variant="ghost" size="lg">
                Create a free account
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
