import { describe, expect, it } from 'vitest';
import { cloudinaryUrl } from './cloudinary';
import { monthlyRecovered, platformFee } from './fees';
import { rulesView } from '../hooks/useMeta';
import { rules as fallbackRules } from '../config/market';

const r = { feePercent: 10, minFee: 50 };

describe('platformFee (same formula as the server)', () => {
  it('takes the percentage', () => expect(platformFee(3000, r)).toBe(300));
  it('takes at least the minimum fee', () => expect(platformFee(200, r)).toBe(50));
  it('never takes more than the order', () => expect(platformFee(40, r)).toBe(40));
  it('rounds to whole naira', () => expect(platformFee(1255, r)).toBe(126));
});

describe('monthlyRecovered', () => {
  it('assumes every portion sells as its own order, for 30 days', () => {
    expect(monthlyRecovered({ portions: 10, price: 6000, discount: 50 }, r)).toEqual({ salePrice: 3000, feeEach: 300, perDay: 27000, perMonth: 810000, days: 30 });
  });
  it('treats empty or odd input as zero', () => {
    expect(monthlyRecovered({ portions: '', price: 'abc', discount: 40 }, r).perMonth).toBe(0);
  });
});

describe('rulesView', () => {
  it('turns the server fraction MIN_DISCOUNT into a whole percent', () => {
    expect(rulesView({ ...fallbackRules, MIN_DISCOUNT: 0.3 }).minDiscount).toBe(30);
    expect(rulesView({ ...fallbackRules, MIN_DISCOUNT: 35 }).minDiscount).toBe(35); // already a percent
  });
  it('has a fallback for every number the pages use', () => {
    for (const [k, v] of Object.entries(rulesView(fallbackRules))) expect(Number.isFinite(v), k).toBe(true);
  });
});

describe('cloudinaryUrl', () => {
  const pic = 'https://res.cloudinary.com/demo/image/upload/v1712/gbaanjo/jollof.jpg';
  it('asks for automatic format and quality at 600px', () => {
    expect(cloudinaryUrl(pic)).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_600/v1712/gbaanjo/jollof.jpg');
  });
  it('can ask for a smaller width', () => {
    expect(cloudinaryUrl(pic, 160)).toContain('/upload/f_auto,q_auto,w_160/v1712/');
  });
  it('leaves other and already-transformed URLs alone', () => {
    expect(cloudinaryUrl('/images/bread.webp')).toBe('/images/bread.webp');
    expect(cloudinaryUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    const done = 'https://res.cloudinary.com/demo/image/upload/w_300,q_auto/v1/x.jpg';
    expect(cloudinaryUrl(done)).toBe(done);
    expect(cloudinaryUrl(undefined)).toBeUndefined();
  });
});
