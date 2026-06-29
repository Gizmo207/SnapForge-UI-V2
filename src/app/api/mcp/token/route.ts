import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/adapters/auth/session';
import { createApiToken, listApiTokens, revokeApiToken } from '@/adapters/supabase/tokenRepository';
import { canOwnerUseMcp } from '@/adapters/billing/entitlement';

export const runtime = 'nodejs';

/**
 * Manage MCP personal access tokens for the signed-in user. Session-authed (NOT
 * token-authed — you can't bootstrap a token with a token). POST creates and
 * returns a raw token ONCE; GET lists token metadata (never the secret); DELETE
 * revokes by id.
 */

// GET /api/mcp/token — list the user's tokens (metadata only).
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  try {
    return NextResponse.json({ tokens: await listApiTokens(userId) });
  } catch (e) {
    return NextResponse.json({ error: 'list_failed', detail: (e as Error).message }, { status: 500 });
  }
}

// POST /api/mcp/token — create a token; returns the raw secret once.
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  // MCP is a Pro feature — block token creation for non-entitled accounts.
  if (!(await canOwnerUseMcp(userId))) {
    return NextResponse.json(
      { error: 'pro_required', detail: 'MCP access is a Pro feature. Upgrade to generate tokens.' },
      { status: 402 },
    );
  }
  let label = 'MCP token';
  try {
    const body = (await request.json()) as { label?: unknown };
    if (typeof body.label === 'string' && body.label.trim()) label = body.label.trim().slice(0, 60);
  } catch {
    /* empty body is fine; use the default label */
  }
  try {
    const { token, info } = await createApiToken(userId, label);
    return NextResponse.json({ token, info }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'create_failed', detail: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/mcp/token?id=… — revoke a token.
export async function DELETE(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  try {
    await revokeApiToken(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'revoke_failed', detail: (e as Error).message }, { status: 500 });
  }
}
