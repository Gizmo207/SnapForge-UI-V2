'use client';

/**
 * Client-side helpers to turn an uploaded .zip or a chosen folder into a
 * { path: content } map of text files, ready to POST as a multi-file component.
 * Binary files, junk dirs, and oversized files are filtered out here so we don't
 * ship megabytes of node_modules to the server.
 */

const TEXT_EXT = /\.(tsx?|jsx?|css|json|svg|mjs|cjs)$/i;
const IGNORE = /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|\.turbo|\.vercel|\.cache)(\/|$)/;
const MAX_FILE_BYTES = 512_000; // skip a single huge file
const MAX_FILES = 400;

function keep(path: string): boolean {
  return TEXT_EXT.test(path) && !IGNORE.test(path);
}

/** Unzip a .zip File into a text-file map (JSZip is lazy-loaded). */
export async function filesFromZip(file: File): Promise<Record<string, string>> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const out: Record<string, string> = {};
  const entries = Object.values(zip.files).filter((e) => !e.dir && keep(e.name));
  for (const entry of entries.slice(0, MAX_FILES)) {
    const content = await entry.async('string');
    if (content.length <= MAX_FILE_BYTES) out[entry.name] = content;
  }
  return out;
}

/** Read a chosen folder (<input webkitdirectory>) into a text-file map. */
export async function filesFromFileList(list: FileList): Promise<Record<string, string>> {
  const files = Array.from(list).filter((f) => {
    const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    return keep(path) && f.size <= MAX_FILE_BYTES;
  });
  const out: Record<string, string> = {};
  for (const f of files.slice(0, MAX_FILES)) {
    const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    out[path] = await f.text();
  }
  return out;
}
