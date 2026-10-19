import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { money as format } from "../components/money";
import {
  categories as fallbackCategories,
  currency as fallbackCurrency,
  feePercent as fallbackFee,
  locale as fallbackLocale,
  paymentProvider as fallbackProvider,
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
      rules: server?.rules || {},
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
