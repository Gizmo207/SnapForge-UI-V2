import { getCurrentUserId } from '@/adapters/auth/session';
import { listComponents } from '@/adapters/supabase/vaultRepository';
import { Landing } from '@/components/Landing';
import { VaultApp } from '@/components/VaultApp';
import type { Component } from '@/domains/shared/component';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <Landing />;
  }

  let components: Component[] = [];
  try {
    components = await listComponents(userId);
  } catch {
    // Persistence not reachable — show an empty vault rather than crash.
    components = [];
  }

  return <VaultApp initial={components} userId={userId} />;
}
