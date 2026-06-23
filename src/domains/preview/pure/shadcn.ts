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
