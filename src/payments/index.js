import opay from "./opay";
import stripe from "./stripe";
import flutterwave from "./flutterwave";
import { paymentProvider as fallback } from "../config/market";

const providers = { opay, stripe, flutterwave };

// getPaymentProvider(meta.paymentProvider). Unknown names (for example "paystack") fall back to the default.
export const getPaymentProvider = (name) =>
  providers[name] || providers[fallback] || opay;
export { startHostedCheckout, verifyPayment } from "./hosted";
