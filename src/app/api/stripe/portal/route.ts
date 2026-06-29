import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/adapters/auth/session';
import { getStripe, appUrl } from '@/adapters/stripe/client';
import { getCustomerId } from '@/adapters/supabase/subscriptionRepository';

export const runtime = 'nodejs';

/** Opens the Stripe billing portal so a subscriber can manage/cancel. */
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const customerId = await getCustomerId(userId);
  if (!customerId) return NextResponse.json({ error: 'no_subscription' }, { status: 400 });

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: 'portal_failed', detail: (e as Error).message }, { status: 500 });
  }
}
