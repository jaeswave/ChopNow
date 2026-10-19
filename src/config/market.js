// Everything that can change per market lives here, so pages never hard-code it.
export const currency = "NGN"; // used to show prices. OPay charges in NGN, so keep it in step with the gateway.
export const locale = "en-NG"; // number formatting
export const paymentProvider = "opay"; // fallback only. The server's /listings/meta says which gateway is really active.
export const feePercent = 10; // fallback only. The server decides the real fee.

// Hero pills and similar
export const foods = [
  "Rice bowls",
  "Fresh bread",
  "Pastries",
  "Fresh produce",
  "Fresh fish",
  "Dairy drinks",
  "Snacks & small chops",
];

// Fallback list. The server's list wins when it answers. These names must match the backend (src/common.ts CATEGORIES).
export const categories = [
  "Cooked meals",
  "Bakery",
  "Fresh produce",
  "Meat & fish",
  "Dairy & drinks",
  "Frozen foods",
  "Snacks & small chops",
  "Groceries",
];

export const facts = [
  ["30%+", "off on every deal"],
  ["Secure", "card, transfer and mobile-money payments"],
  ["8", "categories"],
  ["12+", "cities and growing"],
];

export const rules = []; // filled in step F9 (Trust)
export const faq = []; // filled in step F10 (FAQ)

// One picture per category. Put your own images in public/images/categories/ using the file names listed in the step notes.
const slug = (c) =>
  c
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export const categoryImage = Object.fromEntries(
  categories.map((c) => [c, `/images/categories/${slug(c)}.webp`]),
);
