// Seller questions, shared by /how-it-works and /sell-with-us. r = useRules(), money = useMeta().money.
export const sellerFaq = (r, money, categories) => [
  ['What does it cost to sell?', `Listing is free and there is no set-up cost. GbaanJo keeps ${r.feePercent}% of each order, at least ${money(r.minFee)}, and only when you sell.`],
  ['Why do you need a CAC number?', 'It lets us confirm that every seller is a registered business before they sell food to the public. This keeps buyers safe and builds trust.'],
  ['What can I sell?', `${categories.join(', ')}. Food must be safe to eat and described honestly.`],
  ['What if a buyer does not come?', 'Buyers must collect before the pickup deadline. If they do not, they are not refunded and the sale still counts towards your earnings.'],
  ['Can I cancel a listing?', 'Yes, from My shop. Anyone who has already paid is refunded in full.'],
];
