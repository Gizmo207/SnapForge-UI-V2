import { getSupabaseServerClient } from './client';

/**
 * Owner profiles — the minimal record of who has signed in. Its job today is to
 * fire the welcome email exactly once: the first sign-in claims it, every later
 * sign-in is a no-op. Email/name are kept fresh for transactional sends.
 */

/**
 * Records this sign-in and atomically claims the one-time welcome.
 *
 * Returns true ONLY for the sign-in that first claims the welcome (so the
 * welcome email sends exactly once, even across concurrent sign-ins). The
 * `welcomed_at` flag is set in the same conditional update that decides the
 * winner, so there's no send-twice race.
 */
export async function claimWelcome(
  ownerId: string,
  email?: string | null,
  name?: string | null,
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Ensure a row exists and keep contact details current (without touching the
  // welcome flag — that's claimed below).
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      { owner_id: ownerId, email: email ?? null, name: name ?? null },
      { onConflict: 'owner_id', ignoreDuplicates: false },
    );
  if (upsertError) throw new Error(`profiles upsert failed: ${upsertError.message}`);

  // Claim the welcome: only the row whose welcomed_at is still null gets updated
  // and returned. A returned row means we won and should send the email.
  const { data, error } = await supabase
    .from('profiles')
    .update({ welcomed_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .is('welcomed_at', null)
    .select('owner_id');
  if (error) throw new Error(`profiles claim failed: ${error.message}`);
  return (data?.length ?? 0) > 0;
}
