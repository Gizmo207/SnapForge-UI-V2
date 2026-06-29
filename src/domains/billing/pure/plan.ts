/**
 * Pure billing/plan logic. No Stripe SDK, no DB — just the rules for what a plan
 * is and what it unlocks, so entitlement decisions are deterministic and testable.
 * The MCP server is the paid feature: only Pro/Team (or a configured founder) may
 * use it.
 */

export type Plan = 'free' | 'pro' | 'team';

/** Stripe subscription statuses we treat as "currently entitled". */
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export type SubscriptionState = {
  plan: Plan;
  /** Raw Stripe status, or null for a never-subscribed (free) owner. */
  status: string | null;
};

/** A paid (Pro or Team) plan that is currently in good standing. */
export function isPaid(state: SubscriptionState): boolean {
  if (state.plan === 'free') return false;
  // A null status means "we set this plan directly" (e.g. a comp/founder grant).
  return state.status == null || ACTIVE_STATUSES.has(state.status);
}

/**
 * The single entitlement gate for the MCP server. Founders (configured by
 * owner id) always pass; otherwise the owner needs a paid plan in good standing.
 * When billing isn't being enforced yet, everyone passes (so we can ship the
 * code before flipping the gate on).
 */
export function canUseMcp(params: {
  state: SubscriptionState;
  isFounder: boolean;
  enforced: boolean;
}): boolean {
  if (!params.enforced) return true;
  if (params.isFounder) return true;
  return isPaid(params.state);
}

export type PriceIds = {
  proMonthly?: string;
  proYearly?: string;
  teamMonthly?: string;
  teamYearly?: string;
};

/** Map a Stripe price id back to the plan it represents (for the webhook). */
export function planForPrice(priceId: string | null | undefined, prices: PriceIds): Plan {
  if (!priceId) return 'free';
  if (priceId === prices.teamMonthly || priceId === prices.teamYearly) return 'team';
  if (priceId === prices.proMonthly || priceId === prices.proYearly) return 'pro';
  return 'free';
}

/** Resolve a checkout request (plan + interval) to the configured price id. */
export function priceForSelection(
  plan: 'pro' | 'team',
  interval: 'month' | 'year',
  prices: PriceIds,
): string | null {
  if (plan === 'team') {
    return (interval === 'year' ? prices.teamYearly : prices.teamMonthly) ?? null;
  }
  return (interval === 'year' ? prices.proYearly : prices.proMonthly) ?? null;
}

/** Parse a comma/space separated env list of founder owner ids into a set. */
export function parseFounders(env: string | undefined): Set<string> {
  if (!env) return new Set();
  return new Set(
    env
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
