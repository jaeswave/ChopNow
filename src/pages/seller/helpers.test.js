import { describe, expect, it } from 'vitest';
import { clearDraft, loadDraft, restoreForm, saveDraft } from './draft';
import { isMissingPayoutError } from './errors';

const future = new Date(Date.now() + 2 * 36e5).toISOString().slice(0, 16);
const fresh = { title: '', price: '', saleEndsAt: 'FRESH-END', pickupBy: 'FRESH-PICKUP' };

describe('listing draft', () => {
  it('saves, loads and clears per seller', () => {
    saveDraft(7, { title: 'Bread' });
    expect(loadDraft(7)).toEqual({ title: 'Bread' });
    expect(loadDraft(8)).toBeNull();
    clearDraft(7);
    expect(loadDraft(7)).toBeNull();
  });

  it('ignores a broken saved value', () => {
    sessionStorage.setItem('gj_listing_draft_7', '{not json');
    expect(loadDraft(7)).toBeNull();
  });

  it('restores known fields only and keeps future sale times', () => {
    const f = restoreForm({ title: 'Bread', price: '500', saleEndsAt: future, pickupBy: future, hacked: 'x' }, fresh);
    expect(f).toEqual({ title: 'Bread', price: '500', saleEndsAt: future, pickupBy: future });
  });

  it('replaces sale times that have already passed', () => {
    const f = restoreForm({ title: 'Bread', saleEndsAt: '2020-01-01T10:00', pickupBy: '2020-01-01T12:00' }, fresh);
    expect(f.title).toBe('Bread');
    expect(f.saleEndsAt).toBe('FRESH-END');
    expect(f.pickupBy).toBe('FRESH-PICKUP');
  });

  it('returns the fresh form when there is no draft', () => {
    expect(restoreForm(null, fresh)).toBe(fresh);
  });
});

describe('isMissingPayoutError', () => {
  it("recognises the server's message", () => {
    expect(isMissingPayoutError('Set up your payout account first (My shop, then Payouts) so you can get paid.')).toBe(true);
  });
  it('ignores other errors', () => {
    expect(isMissingPayoutError('Needs at least 30% off')).toBe(false);
    expect(isMissingPayoutError(undefined)).toBe(false);
  });
});
