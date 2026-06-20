import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import {
  ownerAuthDecision,
  type SessionEvidenceStatus,
} from '../../domains/identity-access/pure/ownerAuthDecision';

type SessionShape = { sessionStatus: SessionEvidenceStatus; sessionOwnerId: string | null };

async function readSession(): Promise<SessionShape> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { sessionStatus: 'missing', sessionOwnerId: null };
    return {
      sessionStatus: 'present',
      sessionOwnerId: (session as { ownerId?: string }).ownerId ?? null,
    };
  } catch {
    return { sessionStatus: 'invalid', sessionOwnerId: null };
  }
}

/**
 * Resolves the verified server-side session and applies the pure owner-auth
 * decision. Returns the ownerId only when the caller IS the vault owner;
 * otherwise null (default-deny). Identity is never read from headers or params.
 */
export async function requireOwner(): Promise<string | null> {
  const configuredOwner = process.env.OWNER_ID;
  if (!configuredOwner) return null; // vault not bound -> deny

  const { sessionStatus, sessionOwnerId } = await readSession();
  const outcome = ownerAuthDecision({ sessionStatus, sessionOwnerId, ownerId: configuredOwner });
  return outcome === 'owner' ? configuredOwner : null;
}

/**
 * For the owner-claim bootstrap screen: returns the signed-in identity even when
 * it is not (yet) the configured owner, so the operator can copy it into
 * OWNER_ID. Returns null when there is no valid session.
 */
export async function getSignedInOwnerId(): Promise<string | null> {
  const { sessionStatus, sessionOwnerId } = await readSession();
  return sessionStatus === 'present' ? sessionOwnerId : null;
}
