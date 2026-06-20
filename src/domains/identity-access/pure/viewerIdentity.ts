export type SessionEvidenceStatus = 'missing' | 'present' | 'invalid';

export type ViewerIdentity =
  | { status: 'identified'; userId: string }
  | { status: 'unauthenticated' }
  | { status: 'invalid' };

export type ViewerIdentityInput = {
  sessionStatus: SessionEvidenceStatus;
  /** The identity resolved from the verified session, when present. */
  sessionUserId?: string | null;
};

/**
 * Multi-user identity decision. Pure, default-deny.
 *
 * Every authenticated user is the owner of their OWN vault — there is no single
 * configured owner. Identity comes only from verified session evidence (never
 * headers or params). Data is later scoped by the returned userId, so one user
 * can never see another's components.
 *
 *  - No session            -> unauthenticated (default-deny)
 *  - Invalid evidence      -> invalid (hard failure)
 *  - Present but actorless  -> invalid (contradictory)
 *  - Present with a userId  -> identified
 */
export function decideViewerIdentity(input: ViewerIdentityInput): ViewerIdentity {
  const { sessionStatus, sessionUserId } = input;

  if (sessionStatus === 'invalid') return { status: 'invalid' };
  if (sessionStatus === 'missing') return { status: 'unauthenticated' };
  if (!sessionUserId) return { status: 'invalid' };
  return { status: 'identified', userId: sessionUserId };
}
