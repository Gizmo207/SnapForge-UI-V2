import { getSupabaseServerClient } from '@/adapters/supabase/client';

export const runtime = 'nodejs';

/**
 * Diagnostic endpoint: confirms whether the server can reach Supabase, which
 * database role the configured key maps to, and whether it can actually write.
 * A read-only/publishable key reports role "anon" and fails the write test; the
 * service-role secret key reports "service_role" and writes succeed.
 *
 * GET /api/health
 */
export async function GET() {
  const out: Record<string, unknown> = { ok: false };

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return Response.json({ ok: false, stage: 'config', error: (e as Error).message });
  }

  // Which Postgres role is the key acting as?
  try {
    const { data, error } = await supabase.rpc('debug_whoami');
    out.role = error ? `unknown (${error.message})` : data;
  } catch (e) {
    out.role = `unknown (${(e as Error).message})`;
  }

  // Can it read?
  const read = await supabase.from('components').select('*', { count: 'exact', head: true });
  out.canRead = !read.error;
  if (read.error) out.readError = read.error.message;

  // Can it write? (insert a throwaway row, then remove it)
  const probeId = '00000000-0000-0000-0000-0000000000aa';
  const write = await supabase.from('components').insert({
    component_id: probeId,
    owner_id: '__healthcheck__',
    name: 'healthcheck',
    framework: 'html',
    source: '<i></i>',
    sanitization_outcome: 'blocked',
    category: 'components',
    subcategory: 'misc',
  });
  out.canWrite = !write.error;
  if (write.error) out.writeError = write.error.message;
  else await supabase.from('components').delete().eq('component_id', probeId);

  out.ok = out.canRead === true && out.canWrite === true;
  return Response.json(out);
}
