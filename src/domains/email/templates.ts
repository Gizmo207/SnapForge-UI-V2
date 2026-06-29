/**
 * Transactional email copy as pure functions. No I/O — each returns a subject
 * and ready-to-send HTML, so the wording is testable and lives in one place.
 * Keep the voice plain and human: short sentences, no marketing clutter.
 */

export type EmailContent = { subject: string; html: string };

const BRAND = 'SnapForge UI';
const APP_URL = 'https://www.snapforgeui.com';

/** Shared shell: a simple, dark, on-brand frame around the message body. */
function shell(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#08080f;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e7e7ee;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0e0e17;border:1px solid #1d1d2a;border-radius:18px;overflow:hidden;">
          <tr><td style="height:6px;background:linear-gradient(90deg,#8b5cf6,#ec4899);"></td></tr>
          <tr><td style="padding:34px 36px 8px;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8b5cf6;font-weight:700;">${BRAND}</div>
            <h1 style="margin:14px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">${heading}</h1>
          </td></tr>
          <tr><td style="padding:14px 36px 32px;font-size:15px;line-height:1.6;color:#c7c7d4;">
            ${bodyHtml}
          </td></tr>
        </table>
        <div style="margin-top:18px;font-size:12px;color:#5a5a6b;">SnapForge UI · your component vault · ${APP_URL}</div>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin:22px 0 6px;padding:12px 22px;border-radius:12px;background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;">${label}</a>`;
}

/** Sent the first time someone signs in. */
export function welcomeEmail(name?: string | null): EmailContent {
  const hi = name?.trim() ? `Hey ${escapeHtml(name.trim().split(' ')[0])},` : 'Hey there,';
  return {
    subject: 'Welcome to SnapForge UI',
    html: shell(
      'Your vault is live',
      `<p style="margin:0 0 14px;">${hi}</p>
       <p style="margin:0 0 14px;">Welcome aboard. Paste any React or HTML component and SnapForge classifies it, sandboxes it, and saves it with a live preview. Build up a vault of the pieces you actually reuse.</p>
       <p style="margin:0 0 6px;">When you want your AI agent to build straight from your vault, upgrade to Pro and connect it over MCP. Claude Code, Cursor, Windsurf, and any agent that speaks MCP can then search and pull your components.</p>
       ${button('Open your vault', APP_URL)}
       <p style="margin:18px 0 0;color:#9a9aa8;">Happy forging,<br/>Peter</p>`,
    ),
  };
}

/** Sent from the Stripe webhook when a subscription goes active. */
export function proThankYouEmail(name?: string | null): EmailContent {
  const hi = name?.trim() ? `Thanks ${escapeHtml(name.trim().split(' ')[0])},` : 'Thank you,';
  return {
    subject: "You're on SnapForge Pro",
    html: shell(
      'Pro is unlocked',
      `<p style="margin:0 0 14px;">${hi} you're on Pro.</p>
       <p style="margin:0 0 14px;">Your MCP server is live. Open your vault, click <strong>Connect AI · MCP</strong> in the top bar, and generate a token for each agent you want to plug in. Give every agent its own named token so you can revoke one without touching the rest.</p>
       <p style="margin:0 0 6px;">From there your agents can search, list, and pull your saved components to build with.</p>
       ${button('Generate a token', APP_URL)}
       <p style="margin:18px 0 0;color:#9a9aa8;">Welcome to Pro,<br/>Peter</p>`,
    ),
  };
}

/** Minimal HTML-escape for interpolated user names. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
