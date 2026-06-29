import Stripe from 'stripe';
import type { PriceIds } from '../../domains/billing/pure/plan';

/** Lazily construct the Stripe client (throws clearly if the key is missing). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

/** The configured Stripe price ids for each plan/interval. */
export function priceIds(): PriceIds {
  return {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    teamMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
  };
}

/** Canonical app URL for Stripe redirect/return URLs. */
export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.snapforgeui.com'
  ).replace(/\/$/, '');
}
