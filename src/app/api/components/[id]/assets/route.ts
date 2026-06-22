import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/adapters/auth/session';
import {
  ownsComponent,
  uploadAssetFile,
  addComponentAsset,
} from '@/adapters/supabase/vaultRepository';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// POST /api/components/[id]/assets — upload a file for a referenced asset path.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await params;
  if (!(await ownsComponent(id, userId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'expected multipart form data' }, { status: 400 });
  }

  const refPath = form.get('refPath');
  const file = form.get('file');
  if (typeof refPath !== 'string' || !refPath) {
    return NextResponse.json({ error: 'refPath is required' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file exceeds 25MB limit' }, { status: 413 });
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    const filename = file.name || refPath.split('/').pop() || 'asset';
    const { storagePath, publicUrl } = await uploadAssetFile({
      ownerId: userId,
      componentId: id,
      filename,
      contentType: file.type || 'application/octet-stream',
      body,
    });
    const asset = await addComponentAsset({
      componentId: id,
      ownerId: userId,
      refPath,
      storagePath,
      publicUrl,
      filename,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'upload_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}
