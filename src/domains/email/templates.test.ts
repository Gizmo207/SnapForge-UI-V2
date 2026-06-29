import { describe, it, expect } from 'vitest';
import { welcomeEmail, proThankYouEmail } from './templates';

describe('welcomeEmail', () => {
  it('greets by first name when provided', () => {
    const { subject, html } = welcomeEmail('Peter Bernaiche');
    expect(subject).toBe('Welcome to SnapForge UI');
    expect(html).toContain('Hey Peter,');
    expect(html).toContain('https://www.snapforgeui.com');
  });

  it('falls back to a generic greeting without a name', () => {
    expect(welcomeEmail(null).html).toContain('Hey there,');
  });

  it('escapes HTML in the name', () => {
    expect(welcomeEmail('<script>').html).not.toContain('<script>');
  });
});

describe('proThankYouEmail', () => {
  it('thanks by first name and points to token generation', () => {
    const { subject, html } = proThankYouEmail('Ada Lovelace');
    expect(subject).toBe("You're on SnapForge Pro");
    expect(html).toContain('Thanks Ada,');
    expect(html).toContain('Connect AI · MCP');
  });

  it('works without a name', () => {
    expect(proThankYouEmail(undefined).html).toContain('Thank you,');
  });
});
