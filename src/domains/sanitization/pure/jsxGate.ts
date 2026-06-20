import ts from 'typescript';
import { allowed, blocked, invalid, type SanitizationDecision } from './types';

/**
 * Identifiers that reach outside the component into host/global capabilities.
 * Referencing any of these (as a value, not as a property name on some object)
 * blocks the snippet. This replaces v1's substring blocklist with a real AST
 * check that is not defeated by casing/whitespace tricks.
 */
const DENY_GLOBALS = new Set([
  'eval', 'Function', 'window', 'document', 'globalThis', 'self',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookie',
  'XMLHttpRequest', 'fetch', 'WebSocket', 'navigator', 'location',
  'parent', 'top', 'opener', 'postMessage', 'importScripts',
]);

/**
 * React/JSX sanitization gate. Parses to a TypeScript AST and walks it for
 * dangerous constructs. Malformed code that does not parse is INVALID (hard
 * failure). Code that references host globals, uses dangerouslySetInnerHTML, or
 * renders a <script> element is BLOCKED. Otherwise ALLOWED, with the validated
 * source as the artifact. Pure and deterministic.
 */
export function jsxGate(source: string): SanitizationDecision {
  if (!source.trim()) return blocked(['empty source']);

  const sourceFile = ts.createSourceFile(
    'snippet.tsx',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  const parseDiagnostics = (sourceFile as unknown as { parseDiagnostics?: unknown[] }).parseDiagnostics;
  if (parseDiagnostics && parseDiagnostics.length > 0) {
    return invalid(['source does not parse as valid JSX/TSX']);
  }

  const reasons = new Set<string>();

  const visit = (node: ts.Node): void => {
    // Denied global identifiers used as a value (not as `obj.window`).
    if (ts.isIdentifier(node) && DENY_GLOBALS.has(node.text)) {
      const parent = node.parent;
      const isPropertyName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && parent.propertyName === node);
      if (!isPropertyName) {
        reasons.add(`references host global: ${node.text}`);
      }
    }

    // dangerouslySetInnerHTML attribute.
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (name === 'dangerouslySetInnerHTML') {
        reasons.add('uses dangerouslySetInnerHTML');
      }
    }

    // <script> JSX elements.
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile).toLowerCase();
      if (tag === 'script') {
        reasons.add('renders a <script> element');
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (reasons.size > 0) return blocked(Array.from(reasons));
  return allowed(source);
}
