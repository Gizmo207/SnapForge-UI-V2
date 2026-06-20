export type SessionEvidenceStatus = 'missing' | 'present' | 'invalid';

export type OwnerAuthInput = {
  sessionStatus: SessionEvidenceStatus;
  /** The identity resolved from the verified session, when present. */
  sessionOwnerId?: string | null;
  /** The single owner the vault is bound to. */
  ownerId: string;
};

export type OwnerAuthOutcome = 'owner' | 'unauthenticated' | 'invalid';

/**
 * Single-owner authentication decision. Pure, default-deny.
 *
 *  - Identity comes only from verified session evidence (never headers/params).
 *  - No session, or a session that does not resolve to the owner -> unauthenticated.
 *  - Contradictory evidence (present status but no owner id) -> invalid.
 */
export function ownerAuthDecision(input: OwnerAuthInput): OwnerAuthOutcome {
  const { sessionStatus, sessionOwnerId, ownerId } = input;

  if (sessionStatus === 'invalid') return 'invalid';
  if (sessionStatus === 'missing') return 'unauthenticated';

  // sessionStatus === 'present'
  if (!sessionOwnerId) return 'invalid'; // present evidence must carry an actor
  if (sessionOwnerId !== ownerId) return 'unauthenticated'; // valid, but not the owner

  return 'owner';
}
