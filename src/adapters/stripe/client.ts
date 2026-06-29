import Stripe from 'stripe';
import type { PriceIds } from '../../domains/billing/pure/plan';

/** Read an env var, trimmed. Guards against trailing whitespace/CRLF that creeps
 * in when values are piped through a shell (e.g. PowerShell adds a `\r`), which
 * otherwise makes Stripe reject the key/price ids as invalid. */
function env(name: string): string | undefined {
  const v = process.env[name];
  return v ? v.trim() : undefined;
}

/** Lazily construct the Stripe client (throws clearly if the key is missing). */
export function getStripe(): Stripe {
  const key = env('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

/** The configured Stripe price ids for each plan/interval. */
export function priceIds(): PriceIds {
  return {
    proMonthly: env('STRIPE_PRICE_PRO_MONTHLY'),
    proYearly: env('STRIPE_PRICE_PRO_YEARLY'),
    teamMonthly: env('STRIPE_PRICE_TEAM_MONTHLY'),
  };
}

/** Canonical app URL for Stripe redirect/return URLs. */
export function appUrl(): string {
  return (env('NEXT_PUBLIC_APP_URL') || env('NEXTAUTH_URL') || 'https://www.snapforgeui.com').replace(
    /\/$/,
    '',
  );
}
