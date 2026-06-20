import { getSupabaseServerClient } from '@/adapters/supabase/client';

export const runtime = 'nodejs';

/**
 * Diagnostic endpoint: confirms whether the server can reach Supabase with the
 * configured credentials. Returns the underlying error message (e.g. an invalid
 * API key) so misconfiguration is visible without digging through logs.
 *
 * GET /api/health
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { error, count } = await supabase
      .from('components')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return Response.json(
        { ok: false, stage: 'query', error: error.message, hint: error.hint ?? null },
        { status: 200 },
      );
    }
    return Response.json({ ok: true, componentsVisible: count ?? 0 });
  } catch (e) {
    return Response.json(
      { ok: false, stage: 'config', error: (e as Error).message },
      { status: 200 },
    );
  }
}
