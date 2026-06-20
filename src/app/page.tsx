import Link from 'next/link';
import { requireOwner } from '@/adapters/auth/session';
import { listComponents } from '@/adapters/supabase/vaultRepository';
import { Gallery } from '@/components/Gallery';
import type { Component } from '@/domains/shared/component';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const ownerId = await requireOwner();

  if (!ownerId) {
    return (
      <main className="signin">
        <h1>SnapForge UI v2</h1>
        <p>This vault is private. Please sign in.</p>
        <Link href="/api/auth/signin">Sign in</Link>
      </main>
    );
  }

  let components: Component[] = [];
  try {
    components = await listComponents(ownerId);
  } catch {
    // Persistence not configured yet — render an empty vault rather than crash.
    components = [];
  }

  return (
    <main>
      <header className="page-header">
        <h1>SnapForge UI v2</h1>
        <p>Paste a snippet — it is parsed, gated, and previewed in the sandbox.</p>
      </header>
      <Gallery initial={components} />
    </main>
  );
}
