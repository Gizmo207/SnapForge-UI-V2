import JSZip from 'jszip';
import type { ExportBundle } from '../../domains/export/pure/buildExportBundle';

/**
 * I/O adapter: turns a pure ExportBundle into a zip. It performs no decisions —
 * the pure builder already determined (and gated) the file set.
 */
export async function bundleToZip(bundle: ExportBundle): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const file of bundle.files) {
    zip.file(file.path, file.contents);
  }

  // Include a manifest so the operator sees what was excluded and why.
  const manifest = {
    generatedAt: new Date().toISOString(),
    fileCount: bundle.files.length,
    excludedUnsafe: bundle.excludedUnsafe,
    missingArtifact: bundle.missingArtifact,
  };
  zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: 'uint8array' });
}
