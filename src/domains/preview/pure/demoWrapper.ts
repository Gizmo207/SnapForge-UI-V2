/**
 * Turns a component plus a usage snippet into a renderable demo. The usage can be
 * either a bare JSX expression (`<Comp prop={x} />`) OR a full demo *module* — a
 * component with its own state that drives the props (the shadcn / Magic UI
 * pattern, e.g. a `…Demo` that animates a `value` via useState). Both are handled.
 *
 * Pure and deterministic.
 */

import { ensureDefaultExport } from './shadcn';

/** The component's exported name, used to import it in the demo. Handles default
 * exports AND named exports (shadcn components use `export function Foo`). */
export function detectComponentName(code: string): string | null {
  let m = code.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/);
  if (m) return m[1];
  m = code.match(/export\s+default\s+(?:React\.)?(?:memo|forwardRef)?\s*\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*;/);
  if (m && /^[A-Z]/.test(m[1])) return m[1];
  // Named exports (shadcn/Magic UI): export function Foo / export const Foo = / export { Foo }
  m = code.match(/export\s+(?:async\s+)?function\s+([A-Z][\w$]*)/);
  if (m) return m[1];
  m = code.match(/export\s+const\s+([A-Z][\w$]*)\s*[:=]/);
  if (m) return m[1];
  m = code.match(/export\s*\{\s*([A-Z][\w$]*)/);
  if (m) return m[1];
  return null;
}

/** Strips imports and comments from a pasted usage snippet, leaving the JSX. */
export function cleanDemoSource(demo: string): string {
  return demo
    .replace(/^\s*import\s[^\n]*$/gm, '') // we provide the component import
    .replace(/^\s*['"]use client['"];?\s*$/gm, '') // a stray directive
    .replace(/^[ \t]*Copy[ \t]*$/gm, '') // doc-site "Copy" button text picked up in the paste
    .replace(/^\s*\/\/[^\n]*$/gm, '') // line comments between examples
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .trim();
}

/**
 * Whether the demo is a full component *module* (a component declaration, usually
 * with hooks driving the props) rather than a bare JSX usage expression. We look
 * only for top-level component declarations so inline arrows in JSX props (e.g.
 * `onClick={() => …}`) don't false-trigger.
 */
export function isModuleDemo(demo: string): boolean {
  return (
    /export\s+default\s/.test(demo) ||
    /export\s+(?:async\s+)?function\s+[A-Z]/.test(demo) ||
    /(?:^|\n)\s*(?:async\s+)?function\s+[A-Z][\w$]*\s*\(/.test(demo) ||
    /(?:^|\n)\s*(?:export\s+)?const\s+[A-Z][\w$]*\s*[:=][^\n=]*=>/.test(demo)
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds App.tsx from a full demo *module*: point its import of the component at
 * the local `./Component`, keep its other imports (react hooks, etc.), and make
 * the demo component the default export so the harness can mount it.
 */
function buildModuleDemo(componentName: string, demo: string): string {
  const n = escapeRegExp(componentName);
  const code = demo
    // named import: import { Comp, … } from '…'  -> from './Component'
    .replace(
      new RegExp(`(import\\s*\\{[^}]*\\b${n}\\b[^}]*\\}\\s*from\\s*)['"][^'"]+['"]`, 'g'),
      `$1'./Component'`,
    )
    // default import: import Comp from '…'  -> from './Component'
    .replace(new RegExp(`(import\\s+${n}\\s+from\\s*)['"][^'"]+['"]`, 'g'), `$1'./Component'`);
  return ensureDefaultExport(code);
}

/**
 * Builds the `/App.tsx` module. For a module demo, the demo drives everything;
 * for a bare JSX usage, we import the component and render the snippet. Returns
 * null when there's no usable name/demo, so the caller can fall back to rendering
 * the component directly.
 */
export function buildDemoApp(componentCode: string, demo: string): string | null {
  const name = detectComponentName(componentCode);
  if (!name) return null;

  if (isModuleDemo(demo)) return buildModuleDemo(name, demo);

  const body = cleanDemoSource(demo);
  if (!body) return null;
  return `import ${name} from './Component';
export default function App() {
  return (
    <>
${body}
    </>
  );
}
`;
}
