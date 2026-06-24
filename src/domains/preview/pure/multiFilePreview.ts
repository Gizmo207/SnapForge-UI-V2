/**
 * Prepares an uploaded multi-file component for the Sandpack preview: resolves
 * `@/` / `~/` path aliases to real relative imports (so the bundler can find the
 * sibling files), shims `cn` if its utils file wasn't included, and picks what to
 * mount (a demo if present, else the entry). Pure and deterministic.
 */

import {
  ensureDefaultExport,
  rewriteCnImport,
  findUnresolvedAliasImports,
  CN_UTIL_SOURCE,
  CN_SHIM_PATH,
} from './shadcn';
import { pickDemo } from '../../ingestion/pure/multiFile';

const RESOLVE_EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '.json'];
const INDEX_EXTS = ['/index.tsx', '/index.ts', '/index.jsx', '/index.js'];

/** Find the file an `@/<rest>` (or `~/<rest>`) alias points at, trying both
 * project-root and `src/`-root conventions plus the usual extensions. */
function resolveTarget(files: Record<string, string>, rest: string): string | null {
  for (const base of [`/${rest}`, `/src/${rest}`]) {
    for (const ext of RESOLVE_EXTS) if (files[base + ext]) return base + ext;
    for (const idx of INDEX_EXTS) if (files[base + idx]) return base + idx;
  }
  return null;
}

/** A relative import specifier from `fromFile` to `toFile` (extension dropped for
 * code files so Sandpack resolves it). */
export function relSpecifier(fromFile: string, toFile: string): string {
  const fromDirs = fromFile.split('/').filter(Boolean).slice(0, -1);
  const toSegs = toFile.split('/').filter(Boolean);
  const toDirs = toSegs.slice(0, -1);
  let i = 0;
  while (i < fromDirs.length && i < toDirs.length && fromDirs[i] === toDirs[i]) i++;
  const up = fromDirs.length - i;
  const parts = (up > 0 ? Array(up).fill('..') : []).concat(toSegs.slice(i));
  let rel = parts.join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.(tsx?|jsx?)$/i, '');
}

/** Rewrite alias imports to relative paths wherever the target file exists in the
 * upload. Unresolved aliases are left for the cn shim / "missing files" notice. */
export function resolveAliases(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...files };
  for (const [path, content] of Object.entries(files)) {
    out[path] = content.replace(
      /(\bfrom\s*|\bimport\s*|\bimport\(\s*|\brequire\(\s*)(['"])[@~]\/([^'"]*)\2/g,
      (m, pre: string, q: string, rest: string) => {
        const target = resolveTarget(files, rest);
        return target ? `${pre}${q}${relSpecifier(path, target)}${q}` : m;
      },
    );
  }
  return out;
}

export type AssembledPreview = {
  /** All files, alias-resolved + cn-shimmed; the mount file has a default export. */
  files: Record<string, string>;
  /** Relative import for `/index.tsx` to use as `import App from '<mountSpecifier>'`. */
  mountSpecifier: string;
  /** Alias imports we still couldn't resolve (genuinely missing files). */
  unresolved: string[];
  /** Whether the cn shim was added (so the caller declares clsx/tailwind-merge). */
  cnShimmed: boolean;
};

/** Assemble the sandbox file set for a multi-file component. The caller adds the
 * `/index.tsx` harness importing `mountSpecifier`. */
export function assembleMultiFilePreview(
  rawFiles: Record<string, string>,
  entry: string,
): AssembledPreview {
  const files = resolveAliases(rawFiles);

  let cnShimmed = false;
  for (const key of Object.keys(files)) {
    const r = rewriteCnImport(files[key]);
    if (r.rewritten) {
      files[key] = r.code;
      cnShimmed = true;
    }
  }
  if (cnShimmed && !files[CN_SHIM_PATH]) files[CN_SHIM_PATH] = CN_UTIL_SOURCE;

  // Mount a demo (it drives the component's props) if one exists, else the entry.
  const mount = pickDemo(files, entry) ?? entry;
  files[mount] = ensureDefaultExport(files[mount]);

  const unresolved = Array.from(
    new Set(Object.values(files).flatMap(findUnresolvedAliasImports)),
  );

  return { files, mountSpecifier: relSpecifier('/index.tsx', mount), unresolved, cnShimmed };
}
