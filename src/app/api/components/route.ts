import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/adapters/auth/session';
import { captureComponent } from '@/app-core/captureComponent';
import { saveComponent, listComponents } from '@/adapters/supabase/vaultRepository';

export const runtime = 'nodejs';

// GET /api/components — list the signed-in user's vault.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const components = await listComponents(userId);
  return NextResponse.json({ components });
}

// POST /api/components — capture a pasted snippet.
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (typeof body.source !== 'string' || body.source.trim().length === 0) {
    return NextResponse.json({ error: 'source is required' }, { status: 400 });
  }

  const component = captureComponent(body.source, {
    id: () => crypto.randomUUID(),
    now: () => new Date().toISOString(),
  });

  const saved = await saveComponent(component, userId);
  return NextResponse.json({ component: saved }, { status: 201 });
}
