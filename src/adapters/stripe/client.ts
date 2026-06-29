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

// Known-good test-mode price ids, baked in so the integration works even when
// the env vars get corrupted by a shell pipe. Price ids are NOT secret. To move
// to live mode, set clean STRIPE_PRICE_* env vars with the live ids — a valid
// `price_…` env value overrides these.
const FALLBACK_PRICES = {
  proMonthly: 'price_1TnVJO3cBUuvZDG4ipgomdgk',
  proYearly: 'price_1TnVJP3cBUuvZDG4dKDig228',
  teamMonthly: 'price_1TnVJP3cBUuvZDG48C5tzbkn',
} as const;

/** Trust an env price id only if it's a clean `price_…` value; otherwise fall
 * back to the baked-in id (a corrupted/garbled env value is ignored). */
function priceFromEnv(name: string, fallback: string): string {
  const v = env(name);
  return v && /^price_[A-Za-z0-9]+$/.test(v) ? v : fallback;
}

/** The Stripe price ids for each plan/interval. */
export function priceIds(): PriceIds {
  return {
    proMonthly: priceFromEnv('STRIPE_PRICE_PRO_MONTHLY', FALLBACK_PRICES.proMonthly),
    proYearly: priceFromEnv('STRIPE_PRICE_PRO_YEARLY', FALLBACK_PRICES.proYearly),
    teamMonthly: priceFromEnv('STRIPE_PRICE_TEAM_MONTHLY', FALLBACK_PRICES.teamMonthly),
  };
}

/** Canonical app URL for Stripe redirect/return URLs. */
export function appUrl(): string {
  return (env('NEXT_PUBLIC_APP_URL') || env('NEXTAUTH_URL') || 'https://www.snapforgeui.com').replace(
    /\/$/,
    '',
  );
}
