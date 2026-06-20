import { describe, it, expect } from 'vitest';
import { decideViewerIdentity } from './viewerIdentity';

describe('decideViewerIdentity (multi-user, default-deny)', () => {
  it('identifies any authenticated user as the owner of their own vault', () => {
    expect(
      decideViewerIdentity({ sessionStatus: 'present', sessionUserId: 'github:42' }),
    ).toEqual({ status: 'identified', userId: 'github:42' });
  });

  it('identifies a different user as themselves (isolation is by userId)', () => {
    const a = decideViewerIdentity({ sessionStatus: 'present', sessionUserId: 'github:1' });
    const b = decideViewerIdentity({ sessionStatus: 'present', sessionUserId: 'google:2' });
    expect(a).toEqual({ status: 'identified', userId: 'github:1' });
    expect(b).toEqual({ status: 'identified', userId: 'google:2' });
  });

  it('default-denies when no session is present', () => {
    expect(decideViewerIdentity({ sessionStatus: 'missing' })).toEqual({ status: 'unauthenticated' });
  });

  it('treats invalid session evidence as a hard failure', () => {
    expect(decideViewerIdentity({ sessionStatus: 'invalid' })).toEqual({ status: 'invalid' });
  });

  it('treats present-but-actorless evidence as invalid (contradictory)', () => {
    expect(
      decideViewerIdentity({ sessionStatus: 'present', sessionUserId: null }),
    ).toEqual({ status: 'invalid' });
  });
});
