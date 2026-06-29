import { getSupabaseServerClient } from './client';
import type { Plan, SubscriptionState } from '../../domains/billing/pure/plan';

/**
 * I/O adapter for billing state. One row per owner tracks their plan and the
 * Stripe identifiers needed to reconcile webhooks. An owner with no row is Free.
 */

type Row = {
  owner_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: string | null;
  current_period_end: string | null;
};

/** The owner's current plan + status (defaults to free when no row exists). */
export async function getSubscriptionState(ownerId: string): Promise<SubscriptionState> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error || !data) return { plan: 'free', status: null };
  return { plan: (data.plan as Plan) ?? 'free', status: data.status ?? null };
}

/** The Stripe customer id for an owner, if they've ever checked out. */
export async function getCustomerId(ownerId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('owner_id', ownerId)
    .maybeSingle();
  return data?.stripe_customer_id ?? null;
}

/** Reverse lookup used by the webhook: which owner owns this Stripe customer. */
export async function getOwnerByCustomerId(customerId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('owner_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.owner_id ?? null;
}

/** Records the Stripe customer for an owner at checkout time (before any sub). */
export async function linkCustomer(ownerId: string, customerId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('subscriptions')
    .upsert({ owner_id: ownerId, stripe_customer_id: customerId }, { onConflict: 'owner_id' });
  if (error) throw new Error(`linkCustomer failed: ${error.message}`);
}

/** Upserts the full subscription state from a Stripe webhook event. */
export async function upsertSubscription(params: {
  ownerId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: Plan;
  status: string | null;
  currentPeriodEnd: string | null;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const row: Row = {
    owner_id: params.ownerId,
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
    plan: params.plan,
    status: params.status,
    current_period_end: params.currentPeriodEnd,
  };
  const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'owner_id' });
  if (error) throw new Error(`upsertSubscription failed: ${error.message}`);
}
