import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// useListings({ city, category, q }, { limit })
// items: null while loading the first time, then the list. failed: gave up after retries. waking: the server is slow to answer.
export default function useListings(filters = {}, { limit } = {}) {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [waking, setWaking] = useState(false);
  const reqId = useRef(0);
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v),
    ).toString();
    setFailed(false);
    const wake = setTimeout(() => {
      if (reqId.current === id) setWaking(true);
    }, 5000);
    for (let i = 0; i < 6; i++) {
      try {
        const data = await api("/listings?" + qs);
        if (reqId.current !== id) return;
        clearTimeout(wake);
        setWaking(false);
        setItems(limit ? data.slice(0, limit) : data);
        return;
      } catch {
        if (reqId.current !== id) return;
        await sleep(6000);
      }
    }
    if (reqId.current !== id) return;
    clearTimeout(wake);
    setWaking(false);
    setFailed(true);
    setItems([]);
  }, [key, limit]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => {
      clearTimeout(t);
      reqId.current++;
    };
  }, [load]);

  return { items, failed, waking, reload: load };
}
