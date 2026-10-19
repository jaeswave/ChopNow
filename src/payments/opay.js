import { startHostedCheckout, verifyPayment } from "./hosted";

// NOTE: OPay merchant API access is gated and can take time to be approved.
// Flutterwave or Stripe is the working fallback until it is granted (switch PAYMENT_PROVIDER on the server).
export default {
  id: "opay",
  label: "OPay",
  methods: "card, bank transfer and wallet",
  initialize: startHostedCheckout,
  verify: verifyPayment,
};
