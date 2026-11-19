import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { money as format } from "../components/money";
import {
  categories as fallbackCategories,
  currency as fallbackCurrency,
  feePercent as fallbackFee,
  locale as fallbackLocale,
  paymentProvider as fallbackProvider,
  rules as fallbackRules,
} from "../config/market";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const Ctx = createContext(null);

export function MetaProvider({ children }) {
  const [server, setServer] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | failed

  // Render's free server can take up to a minute to wake, so we retry a few times before giving up
  useEffect(() => {
    let stop = false;
    (async () => {
      for (let i = 0; i < 6 && !stop; i++) {
        try {
          const m = await api("/listings/meta");
          if (!stop) {
            setServer(m);
            setStatus("ready");
          }
          return;
        } catch {
          await sleep(6000);
        }
      }
      if (!stop) setStatus("failed");
    })();
    return () => {
      stop = true;
    };
  }, []);

  const value = useMemo(() => {
    const currency = server?.currency || fallbackCurrency;
    const locale = server?.locale || fallbackLocale;
    return {
      status,
      categories: server?.categories?.length
        ? server.categories
        : fallbackCategories,
      cities: server?.cities || [],
      comingSoon: server?.comingSoon || [],
      // { termsVersion, privacyVersion } from a server that supports consent; null from an older server.
      // Release safety: no consent checkbox, prompt or versions are sent while this is null.
      legal: server?.legal?.termsVersion && server?.legal?.privacyVersion ? server.legal : null,
      rules: server?.rules || {}, // the server's rules only (checkout relies on this staying empty until they load)
      ruleValues: { ...fallbackRules, ...server?.rules }, // with fallbacks, for copy and calculators
      feePercent: server?.rules?.PLATFORM_FEE_PERCENT ?? fallbackFee,
      paymentProvider: server?.paymentProvider || fallbackProvider,
      currency,
      locale,
      money: (n) => format(n, currency, locale),
    };
  }, [server, status]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMeta = () => useContext(Ctx);

// The business rules as ready-to-show numbers. Pages use these instead of writing numbers into their copy.
// minDiscount is a whole percent (the server sends MIN_DISCOUNT as a fraction, e.g. 0.3).
export function rulesView(r) {
  const pct = (v) => Math.round(v <= 1 ? v * 100 : v);
  return {
    minDiscount: pct(r.MIN_DISCOUNT),
    feePercent: r.PLATFORM_FEE_PERCENT,
    minFee: r.MIN_FEE,
    buyerFee: r.BUYER_SERVICE_FEE,
    holdMinutes: r.HOLD_MINUTES,
    maxPerOrder: r.MAX_PER_ORDER,
    minSaleMinutes: r.MIN_SALE_MINUTES,
    maxSaleHours: r.MAX_SALE_HOURS,
    maxPickupHours: r.MAX_PICKUP_HOURS,
    maxNoShows: r.MAX_NO_SHOWS,
  };
}
export const useRules = () => rulesView(useMeta().ruleValues);
