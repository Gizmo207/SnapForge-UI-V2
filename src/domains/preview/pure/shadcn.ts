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
 * shadcn components style themselves with theme tokens (`bg-primary`,
 * `text-primary-foreground`, `border-border`, …) that resolve to CSS variables
 * defined in a project's globals.css — not in the copied component. Without them
 * a button has no background/colour. This is the default shadcn theme: the
 * `:root`/`.dark` variables plus the handful of token utility classes (none of
 * which exist in stock Tailwind, so there's no conflict). It also ships the
 * Magic UI box-shadow "pulse" ring keyframes (defined in their tailwind.config,
 * not the component), scoped to elements that set `--pulse-color`/`--bg`.
 * Injected into the preview whenever Tailwind is in use.
 */
export const SHADCN_PRESET_CSS = `
  :root{--background:0 0% 100%;--foreground:240 10% 3.9%;--card:0 0% 100%;--card-foreground:240 10% 3.9%;--popover:0 0% 100%;--popover-foreground:240 10% 3.9%;--primary:240 5.9% 10%;--primary-foreground:0 0% 98%;--secondary:240 4.8% 95.9%;--secondary-foreground:240 5.9% 10%;--muted:240 4.8% 95.9%;--muted-foreground:240 3.8% 46.1%;--accent:240 4.8% 95.9%;--accent-foreground:240 5.9% 10%;--destructive:0 84.2% 60.2%;--destructive-foreground:0 0% 98%;--border:240 5.9% 90%;--input:240 5.9% 90%;--ring:240 5.9% 10%;--radius:.5rem}
  .dark{--background:240 10% 3.9%;--foreground:0 0% 98%;--card:240 10% 3.9%;--card-foreground:0 0% 98%;--popover:240 10% 3.9%;--popover-foreground:0 0% 98%;--primary:0 0% 98%;--primary-foreground:240 5.9% 10%;--secondary:240 3.7% 15.9%;--secondary-foreground:0 0% 98%;--muted:240 3.7% 15.9%;--muted-foreground:240 5% 64.9%;--accent:240 3.7% 15.9%;--accent-foreground:0 0% 98%;--destructive:0 62.8% 30.6%;--destructive-foreground:0 0% 98%;--border:240 3.7% 15.9%;--input:240 3.7% 15.9%;--ring:240 4.9% 83.9%}
  .bg-background{background-color:hsl(var(--background))}.bg-card{background-color:hsl(var(--card))}.bg-popover{background-color:hsl(var(--popover))}.bg-primary{background-color:hsl(var(--primary))}.bg-secondary{background-color:hsl(var(--secondary))}.bg-muted{background-color:hsl(var(--muted))}.bg-accent{background-color:hsl(var(--accent))}.bg-destructive{background-color:hsl(var(--destructive))}
  .text-foreground{color:hsl(var(--foreground))}.text-card-foreground{color:hsl(var(--card-foreground))}.text-popover-foreground{color:hsl(var(--popover-foreground))}.text-primary{color:hsl(var(--primary))}.text-primary-foreground{color:hsl(var(--primary-foreground))}.text-secondary-foreground{color:hsl(var(--secondary-foreground))}.text-muted-foreground{color:hsl(var(--muted-foreground))}.text-accent-foreground{color:hsl(var(--accent-foreground))}.text-destructive{color:hsl(var(--destructive))}
  .border-border{border-color:hsl(var(--border))}.border-input{border-color:hsl(var(--input))}
  @keyframes mui-pulse{0%,100%{box-shadow:0 0 0 0 var(--pulse-color,hsl(var(--primary)))}50%{box-shadow:0 0 0 8px var(--pulse-color,hsl(var(--primary)))}}
  [style*='--pulse-color'] .animate-pulse,[style*='--bg'] .animate-pulse,[style*='--pulse-color'].animate-pulse,[style*='--bg'].animate-pulse{animation:mui-pulse var(--duration,1.5s) ease-out infinite !important}`;

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

/**
 * shadcn/registry components export their component as a NAMED export
 * (`export function Foo`), but the preview harness and demo wrapper import a
 * DEFAULT export. When there's no default export, find the primary PascalCase
 * named export and append `export default Foo;` so it can be imported. No-op when
 * a default export already exists or no named component is found (e.g. HTML).
 */
export function ensureDefaultExport(code: string): string {
  if (/export\s+default\b/.test(code)) return code;
  const m =
    code.match(/export\s+(?:async\s+)?function\s+([A-Z][\w$]*)/) ||
    code.match(/export\s+const\s+([A-Z][\w$]*)\s*[:=]/) ||
    code.match(/export\s+class\s+([A-Z][\w$]*)/) ||
    code.match(/export\s*\{\s*([A-Z][\w$]*)/);
  if (!m) return code;
  return `${code}\nexport default ${m[1]};\n`;
}

