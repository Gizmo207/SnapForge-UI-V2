import ts from 'typescript';
import { allowed, blocked, invalid, type SanitizationDecision } from './types';

/**
 * Dangerous capabilities, blocked whether referenced as a bare value (`fetch`)
 * or via a member (`window.fetch`, `window['fetch']`). The preview runs in a
 * sandboxed iframe, so benign host access (window/document/navigator) is
 * allowed; what we still deny is code-eval, network, and storage — the things
 * that could phone home, exfiltrate, or run remotely-fetched code even from
 * inside the sandbox. A real AST check, not a substring blocklist.
 */
const DENY_GLOBALS = new Set([
  'eval', 'Function',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts',
  'localStorage', 'sessionStorage', 'indexedDB',
]);

const DENY_MEMBERS = new Set([
  'eval', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookie',
]);

/**
 * React/JSX sanitization gate. Parses to a TypeScript AST and walks it for
 * dangerous constructs. Malformed code that does not parse is INVALID (hard
 * failure). Code that uses a denied capability (eval/network/storage, however
 * reached), uses dangerouslySetInnerHTML, or
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
        reasons.add(`uses denied capability: ${node.text}`);
      }
    }

    // Denied capability reached via a member: window.fetch, document.cookie.
    if (ts.isPropertyAccessExpression(node) && DENY_MEMBERS.has(node.name.text)) {
      reasons.add(`uses denied capability: ${node.name.text}`);
    }
    // ...or via element access with a string literal: window['fetch'].
    if (
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      DENY_MEMBERS.has(node.argumentExpression.text)
    ) {
      reasons.add(`uses denied capability: ${node.argumentExpression.text}`);
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
