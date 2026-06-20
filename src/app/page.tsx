import Link from 'next/link';
import { requireOwner, getSignedInOwnerId } from '@/adapters/auth/session';
import { listComponents } from '@/adapters/supabase/vaultRepository';
import { Gallery } from '@/components/Gallery';
import type { Component } from '@/domains/shared/component';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const ownerId = await requireOwner();

  if (!ownerId) {
    const signedInAs = await getSignedInOwnerId();

    // Owner-claim bootstrap: signed in, but OWNER_ID is unset or doesn't match.
    if (signedInAs) {
      const ownerConfigured = Boolean(process.env.OWNER_ID);
      return (
        <main className="signin">
          <h1>SnapForge UI v2</h1>
          {ownerConfigured ? (
            <>
              <p>You are signed in, but this vault belongs to a different owner.</p>
              <p>
                Signed in as <code>{signedInAs}</code>.
              </p>
            </>
          ) : (
            <>
              <p>Almost there — claim this vault.</p>
              <p>
                You are signed in as <code>{signedInAs}</code>. Set the environment
                variable <code>OWNER_ID</code> to that exact value and redeploy to
                claim the vault.
              </p>
            </>
          )}
          <p>
            <Link href="/api/auth/signout">Sign out</Link>
          </p>
        </main>
      );
    }

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
    // Persistence not reachable — render an empty vault rather than crash.
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
