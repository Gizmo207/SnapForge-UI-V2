import JSZip from 'jszip';
import type { ExportBundle } from '../../domains/export/pure/buildExportBundle';

/**
 * I/O adapter: turns a pure ExportBundle into a zip. It performs no decisions —
 * the pure builder already determined (and gated) the file set. Its one job
 * beyond writing is fetching the referenced asset files (server-side, so CORS
 * never applies) and placing them under public/ so the export is self-contained.
 */
export async function bundleToZip(bundle: ExportBundle): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const file of bundle.files) {
    zip.file(file.path, file.contents);
  }

  const bundledAssets: string[] = [];
  const failedAssets: { path: string; reason: string }[] = [];

  await Promise.all(
    bundle.assets.map(async (asset) => {
      try {
        const res = await fetch(asset.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        zip.file(asset.path, bytes);
        bundledAssets.push(asset.path);
      } catch (e) {
        failedAssets.push({ path: asset.path, reason: (e as Error).message });
      }
    }),
  );

  const hasAssets = bundle.assets.length > 0;
  const hasGaps = bundle.missingAssets.length > 0 || failedAssets.length > 0;

  // Include a manifest so the operator sees what was excluded and why.
  const manifest = {
    generatedAt: new Date().toISOString(),
    fileCount: bundle.files.length,
    excludedUnsafe: bundle.excludedUnsafe,
    missingArtifact: bundle.missingArtifact,
    bundledAssets,
    missingAssets: bundle.missingAssets,
    failedAssets,
  };
  zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));

  if (hasAssets || hasGaps) {
    zip.file('README.txt', readme(bundledAssets, bundle.missingAssets, failedAssets));
  }

  return zip.generateAsync({ type: 'uint8array' });
}

function readme(
  bundled: string[],
  missing: { component: string; refPath: string }[],
  failed: { path: string; reason: string }[],
): string {
  const lines = ['SnapForge export', ''];
  if (bundled.length > 0) {
    lines.push(
      'This export includes asset files (3D models, images, fonts) under public/.',
      "Copy the public/ folder into your project's public/ directory so the",
      'components can find them at the paths they reference.',
      '',
      'Bundled assets:',
      ...bundled.map((p) => `  - ${p}`),
      '',
    );
  }
  if (missing.length > 0) {
    lines.push(
      'HEADS UP — these components reference files you never provided, so they',
      'may not render until you add the files yourself:',
      ...missing.map((m) => `  - ${m.component}: ${m.refPath}`),
      '',
    );
  }
  if (failed.length > 0) {
    lines.push(
      'Some assets could not be downloaded at export time:',
      ...failed.map((f) => `  - ${f.path} (${f.reason})`),
      '',
    );
  }
  return lines.join('\n');
}
