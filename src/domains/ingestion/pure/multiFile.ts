/**
 * Ingestion for multi-file components (an uploaded zip/folder). Normalizes the
 * raw file map, picks the entry component, and classifies/names it. Pure, total,
 * deterministic. Alias resolution for the sandbox lives in the preview layer.
 */

import { classify } from './classify';
import { inferName } from './inferName';
import { detectDependencies } from './detectDependencies';
import { detectComponentName } from '../../preview/pure/demoWrapper';

const TEXT_EXT = /\.(tsx?|jsx?|css|json|svg|mjs|cjs)$/i;
const CODE_EXT = /\.(tsx?|jsx?)$/i;
const IGNORE_DIR = /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|\.turbo|\.vercel|\.cache)(\/|$)/;
const IGNORE_FILE = /(^|\/)(package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|tsconfig\.[^/]*\.json|tsconfig\.json|\.eslintrc[^/]*|\.prettierrc[^/]*|\.gitignore|next\.config\.[^/]*|tailwind\.config\.[^/]*|postcss\.config\.[^/]*|vite\.config\.[^/]*|readme\.md)$/i;
const DEMO_RE = /(^|\/|[-_.])(demo|example|stories|story|preview|page)([-_.]|\/|\.|$)/i;

export type MultiFileResult = {
  files: Record<string, string>;
  entry: string;
  source: string;
  framework: 'react';
  name: string;
  category: string;
  subcategory: string;
  tags: string[];
  dependencies: string[];
};

/** Normalize paths to sandbox-absolute (`/a/b.tsx`), keep only text files, drop
 * tooling/junk files and directories. */
export function normalizeFiles(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawPath, content] of Object.entries(raw)) {
    const p = '/' + rawPath.replace(/\\/g, '/').replace(/^\.?\/+/, '').replace(/^\/+/, '');
    if (IGNORE_DIR.test(p)) continue;
    if (IGNORE_FILE.test(p)) continue;
    if (!TEXT_EXT.test(p)) continue;
    out[p] = content;
  }
  return out;
}

/** Strip a directory prefix shared by every file (e.g. a zip's top folder), so
 * `components/`, `lib/`, `src/` sit near the root and `@/` aliases resolve. */
export function stripCommonPrefix(files: Record<string, string>): Record<string, string> {
  const paths = Object.keys(files);
  if (paths.length <= 1) return files;
  const dirSegs = paths.map((p) => p.split('/').filter(Boolean).slice(0, -1));
  let prefix = dirSegs[0];
  for (const dirs of dirSegs) {
    let i = 0;
    while (i < prefix.length && i < dirs.length && prefix[i] === dirs[i]) i++;
    prefix = prefix.slice(0, i);
  }
  if (prefix.length === 0) return files;
  const out: Record<string, string> = {};
  for (const [p, c] of Object.entries(files)) {
    out['/' + p.split('/').filter(Boolean).slice(prefix.length).join('/')] = c;
  }
  return out;
}

/** Files that export a PascalCase React component. */
function componentFiles(files: Record<string, string>): string[] {
  return Object.keys(files).filter((p) => CODE_EXT.test(p) && detectComponentName(files[p]) !== null);
}

/** Whether a path looks like a demo/example rather than the component itself. */
export function isDemoPath(path: string): boolean {
  return DEMO_RE.test(path);
}

/** Identifiers a module imports (named or default), e.g. {Button, cn}. */
function importedIdentifiers(code: string): Set<string> {
  const out = new Set<string>();
  const re = /import\s+(?:\{([^}]*)\}|([A-Za-z_$][\w$]*))\s+from/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) for (const part of m[1].split(',')) {
      const id = part.trim().split(/\s+as\s+/)[0].trim();
      if (id) out.add(id);
    }
    if (m[2]) out.add(m[2]);
  }
  return out;
}

/**
 * Pick the entry component file: the one a demo renders, else the "root" of the
 * import graph (a component nobody else imports — sub-components like a Label are
 * imported by it, not the reverse). Falls back to shallowest, then any code file.
 */
export function pickEntry(files: Record<string, string>): string | null {
  const comps = componentFiles(files);
  if (comps.length === 0) {
    const code = Object.keys(files).filter((p) => CODE_EXT.test(p));
    return code.sort(byShallowest)[0] ?? null;
  }
  const nonDemo = comps.filter((p) => !isDemoPath(p));
  const pool = nonDemo.length ? nonDemo : comps;
  if (pool.length === 1) return pool[0];

  const nameOf = (p: string) => detectComponentName(files[p]);

  // 1) A component a demo file imports.
  const demos = comps.filter(isDemoPath);
  for (const demo of demos.sort(byShallowest)) {
    const imported = importedIdentifiers(files[demo]);
    const hit = pool.find((p) => {
      const n = nameOf(p);
      return n !== null && imported.has(n);
    });
    if (hit) return hit;
  }

  // 2) The root: a component no OTHER pool file imports.
  const importedByPool = new Set<string>();
  for (const p of pool) for (const id of importedIdentifiers(files[p])) importedByPool.add(id);
  const roots = pool.filter((p) => {
    const n = nameOf(p);
    return n !== null && !importedByPool.has(n);
  });
  return (roots.length ? roots : pool).sort(byShallowest)[0];
}

/** A demo/example file that can drive the component's props, if one exists. */
export function pickDemo(files: Record<string, string>, entry: string): string | null {
  const demos = componentFiles(files).filter((p) => p !== entry && isDemoPath(p));
  return demos.sort(byShallowest)[0] ?? null;
}

function byShallowest(a: string, b: string): number {
  const da = a.split('/').length;
  const db = b.split('/').length;
  return da - db || a.length - b.length || a.localeCompare(b);
}

/** Full multi-file ingestion. Returns null if no usable entry is found. */
export function ingestFiles(raw: Record<string, string>): MultiFileResult | null {
  const files = stripCommonPrefix(normalizeFiles(raw));
  if (Object.keys(files).length === 0) return null;
  const entry = pickEntry(files);
  if (!entry) return null;

  const source = files[entry];
  const classification = classify(source);
  const name = inferName(source, {
    subcategory: classification.subcategory,
    tags: classification.tags,
  });
  // Aggregate real dependencies across every file (aliases excluded by detect).
  const dependencies = detectDependencies(Object.values(files).join('\n'));

  return {
    files,
    entry,
    source,
    framework: 'react',
    name,
    category: classification.category,
    subcategory: classification.subcategory,
    tags: classification.tags,
    dependencies,
  };
}
