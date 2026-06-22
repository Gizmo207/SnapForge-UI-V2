import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentUserId } from '@/adapters/auth/session';
import { captureComponent } from '@/app-core/captureComponent';
import {
  saveComponent,
  listComponents,
  updateShowcaseTheme,
  deleteComponent,
} from '@/adapters/supabase/vaultRepository';

export const runtime = 'nodejs';

// GET /api/components — list the signed-in user's vault.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  try {
    const components = await listComponents(userId);
    return NextResponse.json({ components });
  } catch (e) {
    return NextResponse.json(
      { error: 'list_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/components?id=… — remove a component from the vault.
export async function DELETE(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await deleteComponent(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'delete_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}

// PATCH /api/components — update a component's per-card showcase theme.
export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { id?: unknown; showcaseTheme?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { id, showcaseTheme } = body;
  if (typeof id !== 'string' || id.length === 0) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (showcaseTheme !== 'light' && showcaseTheme !== 'dark' && showcaseTheme !== null) {
    return NextResponse.json({ error: 'showcaseTheme must be "light", "dark", or null' }, { status: 400 });
  }

  try {
    const component = await updateShowcaseTheme(id, userId, showcaseTheme);
    return NextResponse.json({ component });
  } catch (e) {
    return NextResponse.json(
      { error: 'update_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/components — capture a pasted snippet.
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { source?: unknown; css?: unknown; demo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (typeof body.source !== 'string' || body.source.trim().length === 0) {
    return NextResponse.json({ error: 'source is required' }, { status: 400 });
  }
  const css = typeof body.css === 'string' ? body.css : undefined;
  const demo = typeof body.demo === 'string' ? body.demo : undefined;

  try {
    const component = captureComponent(
      body.source,
      {
        id: () => randomUUID(),
        now: () => new Date().toISOString(),
      },
      css,
      demo,
    );
    const saved = await saveComponent(component, userId);
    return NextResponse.json({ component: saved }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'capture_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}
