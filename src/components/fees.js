// GbaanJo's fee on one order, in whole naira. Same formula as the server's feeFor():
// the platform percentage, at least the minimum fee, and never more than the order itself.
export const platformFee = (orderTotal, { feePercent, minFee }) =>
  Math.min(orderTotal, Math.max(minFee, Math.round((orderTotal * feePercent) / 100)));

// "Sell with us" estimate. Assumes every portion sells, each as its own order, for `days` days.
// portions per day, normal price in naira, discount in percent.
export function monthlyRecovered({ portions, price, discount }, rules, days = 30) {
  const n = Math.max(0, Math.floor(Number(portions) || 0));
  const normal = Math.max(0, Number(price) || 0);
  const salePrice = Math.round(normal * (1 - (Number(discount) || 0) / 100));
  const feeEach = salePrice > 0 ? platformFee(salePrice, rules) : 0;
  const perDay = n * (salePrice - feeEach);
  return { salePrice, feeEach, perDay, perMonth: perDay * days, days };
}
