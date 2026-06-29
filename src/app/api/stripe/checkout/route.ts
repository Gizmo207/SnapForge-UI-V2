import { NextResponse } from 'next/server';
import { getCurrentUserId, getViewerProfile } from '@/adapters/auth/session';
import { getStripe, priceIds, appUrl } from '@/adapters/stripe/client';
import { priceForSelection } from '@/domains/billing/pure/plan';
import { getCustomerId, linkCustomer } from '@/adapters/supabase/subscriptionRepository';

export const runtime = 'nodejs';

/**
 * Starts a Stripe Checkout session for an upgrade. Session-authed. Reuses the
 * owner's Stripe customer if they have one, else creates and links it. Returns
 * the hosted checkout URL for the client to redirect to.
 */
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { plan?: unknown; interval?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const plan = body.plan === 'team' ? 'team' : 'pro';
  const interval = body.interval === 'year' ? 'year' : 'month';

  const price = priceForSelection(plan, interval, priceIds());
  if (!price) {
    console.error('[checkout] price_not_configured', {
      plan,
      interval,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasProMonthly: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
      hasProYearly: !!process.env.STRIPE_PRICE_PRO_YEARLY,
      hasTeamMonthly: !!process.env.STRIPE_PRICE_TEAM_MONTHLY,
    });
    return NextResponse.json({ error: 'price_not_configured' }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    let customerId = await getCustomerId(userId);
    if (!customerId) {
      const profile = await getViewerProfile();
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,
        metadata: { owner_id: userId },
      });
      customerId = customer.id;
      await linkCustomer(userId, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      // owner_id rides on the subscription so the webhook can map it back even
      // without the customer lookup.
      subscription_data: { metadata: { owner_id: userId } },
      client_reference_id: userId,
      metadata: { owner_id: userId },
      success_url: `${appUrl()}/?upgraded=1`,
      cancel_url: `${appUrl()}/?canceled=1`,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[checkout] checkout_failed:', (e as Error).message);
    return NextResponse.json({ error: 'checkout_failed', detail: (e as Error).message }, { status: 500 });
  }
}
