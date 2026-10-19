import { api } from "../api";

// Every gateway shows its own hosted payment page, so the steps are the same for all of them:
// ask our server to hold the item and create the payment, then send the buyer to the page it gives back.
// The server picks the gateway (PAYMENT_PROVIDER) and works out the price itself. The browser never sends an amount.
export async function startHostedCheckout({ listingId, quantity }) {
  const r = await api("/orders", {
    method: "POST",
    body: { listingId, quantity },
  });
  if (r.authorizationUrl) {
    window.location.href = r.authorizationUrl;
    return { redirected: true };
  }
  return { redirected: false, order: r.order }; // test mode: the order is already paid
}

// The real check happens on our server, which asks the gateway directly. This only reads the result.
export const verifyPayment = (reference) =>
  api("/orders/verify/" + encodeURIComponent(reference));
