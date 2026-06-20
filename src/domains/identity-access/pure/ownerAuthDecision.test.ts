import { describe, it, expect } from 'vitest';
import { ownerAuthDecision } from './ownerAuthDecision';

const OWNER = 'owner-123';

describe('ownerAuthDecision (single-owner, default-deny)', () => {
  it('grants the owner when the verified session resolves to them', () => {
    expect(
      ownerAuthDecision({ sessionStatus: 'present', sessionOwnerId: OWNER, ownerId: OWNER }),
    ).toBe('owner');
  });

  it('default-denies when no session is present', () => {
    expect(ownerAuthDecision({ sessionStatus: 'missing', ownerId: OWNER })).toBe('unauthenticated');
  });

  it('treats a valid non-owner session as unauthenticated', () => {
    expect(
      ownerAuthDecision({ sessionStatus: 'present', sessionOwnerId: 'someone-else', ownerId: OWNER }),
    ).toBe('unauthenticated');
  });

  it('treats invalid session evidence as a hard failure', () => {
    expect(ownerAuthDecision({ sessionStatus: 'invalid', ownerId: OWNER })).toBe('invalid');
  });

  it('treats present-but-actorless evidence as invalid (contradictory)', () => {
    expect(
      ownerAuthDecision({ sessionStatus: 'present', sessionOwnerId: null, ownerId: OWNER }),
    ).toBe('invalid');
  });
});
