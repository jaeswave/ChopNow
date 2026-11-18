// Everything that can change per market lives here, so pages never hard-code it.
export const currency = "NGN"; // used to show prices. OPay charges in NGN, so keep it in step with the gateway.
export const locale = "en-NG"; // number formatting
export const paymentProvider = "opay"; // fallback only. The server's /listings/meta says which gateway is really active.
export const feePercent = 10; // fallback only. The server decides the real fee.

// Fallback business rules, used only until GET /listings/meta answers. The server's values always win.
// Same names and units as the server: MIN_DISCOUNT is a fraction (0.3 = 30%), fees and limits in naira, minutes or hours.
export const rules = {
  MIN_DISCOUNT: 0.3,
  PLATFORM_FEE_PERCENT: feePercent,
  MIN_FEE: 50,
  BUYER_SERVICE_FEE: 100,
  HOLD_MINUTES: 10,
  MAX_PER_ORDER: 5,
  MIN_SALE_MINUTES: 15,
  MAX_SALE_HOURS: 72,
  MAX_PICKUP_HOURS: 24,
  MAX_NO_SHOWS: 3,
};

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
