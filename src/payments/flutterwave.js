import { startHostedCheckout, verifyPayment } from "./hosted";

// The server side of Flutterwave is not built yet. This entry only exists so the provider map is complete.
export default {
  id: "flutterwave",
  label: "Flutterwave",
  methods: "card, bank transfer and mobile money",
  initialize: startHostedCheckout,
  verify: verifyPayment,
};
