import { getSubscriptionState } from '../supabase/subscriptionRepository';
import { canUseMcp, parseFounders } from '../../domains/billing/pure/plan';

/**
 * The one place the app asks "is this owner allowed to use the MCP server?".
 * Combines the pure rule with the runtime config: an enforcement flag (so the
 * gate ships dark until we turn it on) and a founder allow-list (so our own /
 * comped accounts keep access without paying).
 */
export async function canOwnerUseMcp(ownerId: string): Promise<boolean> {
  // MCP is Pro-only by default. Set BILLING_ENFORCED=false to reopen it to all.
  // (.trim() guards against trailing whitespace from shell-set env values.)
  const enforced = process.env.BILLING_ENFORCED?.trim() !== 'false';
  if (!enforced) return true;

  // Founders (us / comped accounts) always pass, even if billing/DB is unreachable.
  const isFounder = parseFounders(process.env.FOUNDER_OWNER_IDS).has(ownerId);
  if (isFounder) return true;

  const state = await getSubscriptionState(ownerId);
  return canUseMcp({ state, isFounder, enforced });
}
