import { startHostedCheckout, verifyPayment } from "./hosted";

// The server side of Stripe is not built yet. This entry only exists so the provider map is complete.
export default {
  id: "stripe",
  label: "Stripe",
  methods: "card and wallet payments",
  initialize: startHostedCheckout,
  verify: verifyPayment,
};
