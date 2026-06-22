/**
 * Turns a component plus a usage snippet into a renderable demo. "Wrapper"
 * components (e.g. Glass Surface) render nothing on their own — they need
 * content passed in. The usage snippet supplies that, so we render the usage
 * with the component imported under its own name.
 *
 * Pure and deterministic.
 */

/** The component's default-export name, used to import it in the demo. */
export function detectComponentName(code: string): string | null {
  let m = code.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/);
  if (m) return m[1];
  m = code.match(/export\s+default\s+(?:React\.)?(?:memo|forwardRef)?\s*\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*;/);
  if (m && /^[A-Z]/.test(m[1])) return m[1];
  return null;
}

/** Strips imports and comments from a pasted usage snippet, leaving the JSX. */
export function cleanDemoSource(demo: string): string {
  return demo
    .replace(/^\s*import\s[^\n]*$/gm, '') // we provide the component import
    .replace(/^\s*\/\/[^\n]*$/gm, '') // line comments between examples
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .trim();
}

/**
 * Builds the `/App.tsx` module that imports the component (as `./Component`)
 * and renders the cleaned usage. Returns null when there's no usable name/demo,
 * so the caller can fall back to rendering the component directly.
 */
export function buildDemoApp(componentCode: string, demo: string): string | null {
  const name = detectComponentName(componentCode);
  const body = cleanDemoSource(demo);
  if (!name || !body) return null;
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
