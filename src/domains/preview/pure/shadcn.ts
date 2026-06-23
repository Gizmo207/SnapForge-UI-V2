/**
 * shadcn / Magic UI / Aceternity components are distributed via a CLI, not as
 * self-contained snippets. The one near-universal local dependency is the `cn`
 * class-name helper, imported from a project path alias like `@/lib/utils`. That
 * file isn't in the pasted code, so the preview can't resolve it. We provide a
 * drop-in `cn` and rewrite those imports to point at it — this alone makes a
 * large share of shadcn-style components render. Pure and deterministic;
 * preview-only (the stored source keeps its original `@/lib/utils` import so
 * exports still match the user's real project).
 */

/** The standard shadcn `cn` helper, provided to the sandbox as a local module. */
export const CN_UTIL_SOURCE = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

/** Path (within the sandbox) of the provided cn shim. */
export const CN_SHIM_PATH = '/lib/cn.ts';

/**
 * Rewrites any `import { cn } from "@/…"` (shadcn alias) to the local shim, so
 * Sandpack can resolve it. Matches single- or multi-line named imports that
 * include `cn`, from any `@/`-aliased path. Returns the (possibly) rewritten code
 * and whether a rewrite happened (so the caller knows to add the shim + deps).
 */
export function rewriteCnImport(code: string): { code: string; rewritten: boolean } {
  let rewritten = false;
  const out = code.replace(
    /(import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*)['"]@\/[^'"]*['"]/g,
    (_match, head: string) => {
      rewritten = true;
      return `${head}'./lib/cn'`;
    },
  );
  return { code: out, rewritten };
}

/**
 * Path-alias imports (`@/…`, `~/…`) the sandbox can't resolve — i.e. files from
 * the source project that aren't in the paste (e.g. a registry component, a
 * sibling UI primitive). Run this AFTER rewriteCnImport so the shimmed `cn` is
 * already handled; anything left is a genuinely missing local file. Sandpack
 * would otherwise try to npm-fetch these and fail cryptically, so the caller can
 * use this to show a clear "paste the real source" message instead.
 */
export function findUnresolvedAliasImports(code: string): string[] {
  const out = new Set<string>();
  const re = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]((?:@|~)\/[^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) out.add(m[1]);
  return Array.from(out);
}

