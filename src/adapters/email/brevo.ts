import type { EmailContent } from '../../domains/email/templates';

/**
 * Transactional email via Brevo's HTTP API (POST /v3/smtp/email).
 *
 * Best-effort by design: if BREVO_API_KEY isn't set the send is a no-op that
 * returns false, so sign-in and the Stripe webhook never break just because
 * email isn't configured yet. Never throws to its caller.
 *
 * Sender defaults to the account's verified sender; override with
 * BREVO_SENDER_EMAIL / BREVO_SENDER_NAME (the email MUST be a verified Brevo
 * sender or the API rejects the send).
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function env(name: string): string | undefined {
  const v = process.env[name];
  return v ? v.trim() : undefined;
}

export type EmailRecipient = { email: string; name?: string | null };

/** Send one transactional email. Returns true if Brevo accepted it. */
export async function sendEmail(to: EmailRecipient, content: EmailContent): Promise<boolean> {
  const apiKey = env('BREVO_API_KEY');
  if (!apiKey) {
    // Email not configured yet — quietly skip rather than fail the caller.
    return false;
  }
  if (!to.email) return false;

  const sender = {
    email: env('BREVO_SENDER_EMAIL') || 'investing2188@gmail.com',
    name: env('BREVO_SENDER_NAME') || 'SnapForge UI',
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to.email, name: to.name?.trim() || undefined }],
        subject: content.subject,
        htmlContent: content.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[brevo] send failed', res.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[brevo] send error', (e as Error).message);
    return false;
  }
}
