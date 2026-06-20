import { requireOwner } from '@/adapters/auth/session';
import { getComponentsByIds } from '@/adapters/supabase/vaultRepository';
import { buildExportBundle } from '@/domains/export/pure/buildExportBundle';
import { bundleToZip } from '@/adapters/export/zipAdapter';

export const runtime = 'nodejs';

// POST /api/export — multi-select export to a zip bundle.
export async function POST(request: Request) {
  const ownerId = await requireOwner();
  if (!ownerId) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === 'string') : [];
  if (ids.length === 0) {
    return Response.json({ error: 'ids is required' }, { status: 400 });
  }

  const components = await getComponentsByIds(ids, ownerId);
  // The pure builder enforces the sanitization gate; only allowed components
  // contribute files.
  const bundle = buildExportBundle(components);
  const zip = await bundleToZip(bundle);

  return new Response(zip as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="snapforge-export.zip"',
    },
  });
}
