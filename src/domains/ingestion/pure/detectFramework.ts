export type Framework = 'react' | 'html';

/**
 * Deterministically decides whether a pasted snippet is a React component or
 * plain HTML. Total: always returns one of the two. No I/O.
 *
 * React is indicated by an explicit react import, a JSX-runtime import, the use
 * of React hooks, a `className=` attribute, or JSX returned from JS module
 * syntax (export default / function / arrow / const assignment combined with a
 * JSX tag). Everything else is plain html.
 *
 * Getting this right matters for safety, not just taxonomy: a React snippet
 * misrouted to the HTML gate would have its JSX expressions (e.g.
 * `{document.cookie}`) treated as inert text and could slip through. The fixture
 * corpus pins these edge cases.
 */
export function detectFramework(code: string): Framework {
  const hasReactImport = /import\s+[^;]*?from\s+['"]react['"]/.test(code);
  const hasJsxRuntime = /from\s+['"]react\/jsx-runtime['"]/.test(code);
  const hasHook = /\buse(?:State|Effect|Ref|Memo|Callback|Reducer|Context)\s*\(/.test(code);
  const hasClassName = /className\s*=/.test(code);

  // Structural JS module syntax (not prose like "return policy").
  const hasJsSyntax = /(?:export\s+default|function\s+\w|=>|const\s+\w+\s*=)/.test(code);
  const hasJsxTag = /<[A-Za-z]/.test(code);

  const isReact =
    hasReactImport ||
    hasJsxRuntime ||
    hasHook ||
    hasClassName ||
    (hasJsSyntax && hasJsxTag);

  return isReact ? 'react' : 'html';
}
