const BASE = import.meta.env.VITE_API_URL;

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Can't reach the server. Check your internet connection and try again.",
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(". ")
        : data.message || "Something went wrong",
    );
  }
  return data;
}

/**
 * Fetch and guarantee an array back.
 * Usage: const listings = await apiArray('/listings?city=Lagos');
 */
export async function apiArray(path, opts) {
  const data = await api(path, opts);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/**
 * Fetch and guarantee an object with the given keys.
 * Array defaults become [] when the API returns null/undefined.
 * Usage: const meta = await apiShape('/listings/meta', { categories: [], cities: [] });
 */
export async function apiShape(path, defaults, opts) {
  const data = await api(path, opts);
  const out = {};
  for (const key of Object.keys(defaults)) {
    const val = data?.[key];
    const def = defaults[key];
    if (Array.isArray(def)) {
      out[key] = Array.isArray(val) ? val : [];
    } else if (def && typeof def === "object") {
      out[key] = val && typeof val === "object" ? val : def;
    } else {
      out[key] = val ?? def;
    }
  }
  return out;
}
