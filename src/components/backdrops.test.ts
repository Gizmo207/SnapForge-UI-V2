import { describe, it, expect } from 'vitest';
import { backdropCss, nextBackdrop, BACKDROP_ORDER } from './showcase';

describe('backdrops', () => {
  it('returns null CSS for no backdrop', () => {
    expect(backdropCss(null)).toBeNull();
    expect(backdropCss(undefined)).toBeNull();
  });

  it('returns a CSS background for each known backdrop', () => {
    for (const id of BACKDROP_ORDER) {
      expect(typeof backdropCss(id)).toBe('string');
      expect(backdropCss(id)!.length).toBeGreaterThan(0);
    }
  });

  it('cycles none -> first -> ... -> last -> none', () => {
    let cur = nextBackdrop(null);
    expect(cur).toBe(BACKDROP_ORDER[0]);
    for (let i = 1; i < BACKDROP_ORDER.length; i++) {
      cur = nextBackdrop(cur);
      expect(cur).toBe(BACKDROP_ORDER[i]);
    }
    // After the last, it wraps back to the plain stage (null).
    expect(nextBackdrop(BACKDROP_ORDER[BACKDROP_ORDER.length - 1])).toBeNull();
  });
});
