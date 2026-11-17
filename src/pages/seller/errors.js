// The server sends no error code when a listing is refused for missing payout details, only this message:
// "Set up your payout account first (My shop, then Payouts) so you can get paid."
// If that wording changes, update this check (and its test).
export const isMissingPayoutError = (message = '') => /payout account/i.test(message);
