import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, priceIds } from '@/adapters/stripe/client';
import { planForPrice, isPaid } from '@/domains/billing/pure/plan';
import { upsertSubscription, getOwnerByCustomerId } from '@/adapters/supabase/subscriptionRepository';
import { sendEmail } from '@/adapters/email/brevo';
import { proThankYouEmail } from '@/domains/email/templates';

export const runtime = 'nodejs';

/**
 * Stripe webhook. Verifies the signature, then syncs subscription lifecycle
 * events into the `subscriptions` table so the MCP gate reflects reality. Maps
 * the Stripe customer/subscription back to our owner_id via subscription
 * metadata, falling back to the customer-id link recorded at checkout.
 */
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!sig || !secret) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `signature: ${(e as Error).message}` }, { status: 400 });
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const ownerId =
        (sub.metadata?.owner_id as string | undefined) ||
        (await getOwnerByCustomerId(customerId)) ||
        null;

      if (ownerId) {
        const deleted = event.type === 'customer.subscription.deleted';
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const periodEnd = (sub as { current_period_end?: number }).current_period_end;
        const plan = deleted ? 'free' : planForPrice(priceId, priceIds());
        const status = deleted ? 'canceled' : sub.status;
        await upsertSubscription({
          ownerId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan,
          status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        });

        // Thank-you email on the FIRST activation only (subscription.created with
        // a paid plan in good standing). Best-effort; never fails the webhook.
        if (event.type === 'customer.subscription.created' && isPaid({ plan, status })) {
          try {
            const customer = await getStripe().customers.retrieve(customerId);
            const email = !('deleted' in customer) ? customer.email : null;
            const name = !('deleted' in customer) ? customer.name : null;
            if (email) await sendEmail({ email, name }, proThankYouEmail(name));
          } catch (e) {
            console.error('[webhook] thank-you email skipped:', (e as Error).message);
          }
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
