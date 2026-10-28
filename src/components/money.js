import {
  currency as defaultCurrency,
  locale as defaultLocale,
} from "../config/market";

// money(2500) gives "₦2,500". Currency and locale come from the server when it tells us, otherwise from config/market.js.
export const money = (n, currency = defaultCurrency, locale = defaultLocale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
