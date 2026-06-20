import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import {
  ownerAuthDecision,
  type SessionEvidenceStatus,
} from '../../domains/identity-access/pure/ownerAuthDecision';

/**
 * Resolves the verified server-side session and applies the pure owner-auth
 * decision. Returns the ownerId only when the caller IS the vault owner;
 * otherwise null (default-deny). Identity is never read from headers or params.
 */
export async function requireOwner(): Promise<string | null> {
  const configuredOwner = process.env.OWNER_ID;
  if (!configuredOwner) return null; // vault not bound -> deny

  let sessionStatus: SessionEvidenceStatus = 'missing';
  let sessionOwnerId: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (session) {
      sessionStatus = 'present';
      sessionOwnerId = (session as { ownerId?: string }).ownerId ?? null;
    }
  } catch {
    sessionStatus = 'invalid';
  }

  const outcome = ownerAuthDecision({
    sessionStatus,
    sessionOwnerId,
    ownerId: configuredOwner,
  });

  return outcome === 'owner' ? configuredOwner : null;
}
