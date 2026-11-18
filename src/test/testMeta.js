// Server meta with deliberately unusual values. If a page shows these (and not the usual 30%, 10%, ₦50, ₦100,
// 10 minutes), its numbers really come from GET /listings/meta and are not written into the page.
export const TEST_META = {
  categories: ['Bakery', 'Groceries', 'Zobo and drinks'],
  cities: ['Lagos'],
  currency: 'NGN',
  locale: 'en-NG',
  rules: {
    MIN_DISCOUNT: 0.37,
    PLATFORM_FEE_PERCENT: 12,
    MIN_FEE: 75,
    BUYER_SERVICE_FEE: 150,
    HOLD_MINUTES: 17,
    MAX_PER_ORDER: 4,
    MIN_SALE_MINUTES: 25,
    MAX_SALE_HOURS: 48,
    MAX_PICKUP_HOURS: 21,
    MAX_NO_SHOWS: 2,
  },
};

// The usual values. None of them may appear on a page rendered with TEST_META.
export const DEFAULT_NUMBERS = [/\b30%/, /\b10%/, /₦50\b/, /₦100\b/, /\b10 minutes/, /up to 5\)/, /\b8 categories/];
