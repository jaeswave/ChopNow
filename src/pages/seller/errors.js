// Which setup card a failed listing request should show: 'payout', 'email' or null (show the error message).
// The server sends a stable err.code for these (see "API conventions" in CLAUDE.md).
export function setupBlockFromError(err) {
  if (err?.code === 'PAYOUT_REQUIRED') return 'payout';
  if (err?.code === 'EMAIL_NOT_VERIFIED') return 'email';
  // Fallback for a server that does not send codes yet. It can be removed once every deployed server sends err.code.
  if (!err?.code && isMissingPayoutError(err?.message)) return 'payout';
  return null;
}

// Old wording-based check, used only by the fallback above. The server's message is:
// "Set up your payout account first (My shop, then Payouts) so you can get paid."
export const isMissingPayoutError = (message = '') => /payout account/i.test(message);
