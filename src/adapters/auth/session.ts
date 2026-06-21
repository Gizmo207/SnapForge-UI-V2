import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import {
  decideViewerIdentity,
  type SessionEvidenceStatus,
} from '../../domains/identity-access/pure/viewerIdentity';

type SessionShape = { sessionStatus: SessionEvidenceStatus; sessionUserId: string | null };

async function readSession(): Promise<SessionShape> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { sessionStatus: 'missing', sessionUserId: null };
    return {
      sessionStatus: 'present',
      sessionUserId: (session as { ownerId?: string }).ownerId ?? null,
    };
  } catch {
    return { sessionStatus: 'invalid', sessionUserId: null };
  }
}

/**
 * Multi-user: returns the signed-in user's id (their own vault key) or null when
 * not authenticated. Every authenticated user owns their own vault; data is
 * scoped by this id so users never see each other's components. Identity is
 * never read from headers or params.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { sessionStatus, sessionUserId } = await readSession();
  const identity = decideViewerIdentity({ sessionStatus, sessionUserId });
  return identity.status === 'identified' ? identity.userId : null;
}

export type ViewerProfile = { name: string | null; email: string | null; image: string | null };

/** Display-only profile for the header (name/email/avatar). Never an authority. */
export async function getViewerProfile(): Promise<ViewerProfile> {
  try {
    const session = await getServerSession(authOptions);
    const u = (session as { user?: { name?: string; email?: string; image?: string } } | null)?.user;
    return { name: u?.name ?? null, email: u?.email ?? null, image: u?.image ?? null };
  } catch {
    return { name: null, email: null, image: null };
  }
}
