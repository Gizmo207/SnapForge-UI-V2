import { describe, it, expect } from 'vitest';
import {
  isPaid,
  canUseMcp,
  planForPrice,
  priceForSelection,
  parseFounders,
} from './plan';

describe('isPaid', () => {
  it('free is never paid', () => {
    expect(isPaid({ plan: 'free', status: null })).toBe(false);
  });
  it('pro/team paid only when status is active or trialing (or a direct grant)', () => {
    expect(isPaid({ plan: 'pro', status: 'active' })).toBe(true);
    expect(isPaid({ plan: 'pro', status: 'trialing' })).toBe(true);
    expect(isPaid({ plan: 'pro', status: null })).toBe(true); // direct/comp grant
    expect(isPaid({ plan: 'pro', status: 'past_due' })).toBe(false);
    expect(isPaid({ plan: 'team', status: 'canceled' })).toBe(false);
  });
});

describe('canUseMcp', () => {
  const free = { plan: 'free' as const, status: null };
  const pro = { plan: 'pro' as const, status: 'active' };

  it('passes everyone when not enforced', () => {
    expect(canUseMcp({ state: free, isFounder: false, enforced: false })).toBe(true);
  });
  it('blocks free when enforced', () => {
    expect(canUseMcp({ state: free, isFounder: false, enforced: true })).toBe(false);
  });
  it('allows paid when enforced', () => {
    expect(canUseMcp({ state: pro, isFounder: false, enforced: true })).toBe(true);
  });
  it('founders always pass when enforced', () => {
    expect(canUseMcp({ state: free, isFounder: true, enforced: true })).toBe(true);
  });
});

describe('planForPrice', () => {
  const prices = { proMonthly: 'price_pm', proYearly: 'price_py', teamMonthly: 'price_tm' };
  it('maps price ids to plans', () => {
    expect(planForPrice('price_pm', prices)).toBe('pro');
    expect(planForPrice('price_py', prices)).toBe('pro');
    expect(planForPrice('price_tm', prices)).toBe('team');
    expect(planForPrice('price_unknown', prices)).toBe('free');
    expect(planForPrice(null, prices)).toBe('free');
  });
});

describe('priceForSelection', () => {
  const prices = { proMonthly: 'price_pm', proYearly: 'price_py', teamMonthly: 'price_tm' };
  it('resolves plan+interval to the right price id', () => {
    expect(priceForSelection('pro', 'month', prices)).toBe('price_pm');
    expect(priceForSelection('pro', 'year', prices)).toBe('price_py');
    expect(priceForSelection('team', 'month', prices)).toBe('price_tm');
  });
  it('returns null when the price is not configured', () => {
    expect(priceForSelection('pro', 'month', {})).toBeNull();
  });
});

describe('parseFounders', () => {
  it('parses a comma or space separated list', () => {
    expect([...parseFounders('github:1, google:2  github:3')]).toEqual([
      'github:1',
      'google:2',
      'github:3',
    ]);
    expect(parseFounders(undefined).size).toBe(0);
  });
});
