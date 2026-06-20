import DOMPurify from 'isomorphic-dompurify';
import { allowed, blocked, type SanitizationDecision } from './types';

/**
 * HTML sanitization gate. Decides on DOMPurify's cleaned DOM — never on raw
 * string scans. Default-deny: if DOMPurify had to strip anything dangerous
 * (script elements, event-handler attributes, unsafe URLs, etc.), the snippet
 * is BLOCKED rather than silently rendering a neutered version. Pristine-safe
 * markup is ALLOWED, with the cleaned markup as the artifact.
 */
export function htmlGate(source: string): SanitizationDecision {
  if (!source.trim()) return blocked(['empty source']);

  const clean = DOMPurify.sanitize(source);

  // DOMPurify.removed logs what it stripped. Comment nodes are inert and benign;
  // anything else removed (dangerous elements/attributes) is a block signal.
  const removed = (DOMPurify.removed ?? []) as Array<{
    element?: { nodeType?: number; tagName?: string };
    attribute?: { name?: string };
    from?: { nodeName?: string };
  }>;

  const dangerous = removed.filter((entry) => {
    const node = entry.element;
    if (node && node.nodeType === 8) return false; // HTML comment -> benign
    return true;
  });

  if (dangerous.length > 0) {
    const reasons = dangerous.map((entry) => {
      if (entry.attribute?.name) {
        return `stripped unsafe attribute: ${entry.attribute.name}`;
      }
      if (entry.element?.tagName) {
        return `stripped unsafe element: <${entry.element.tagName.toLowerCase()}>`;
      }
      return 'stripped unsafe content';
    });
    return blocked(Array.from(new Set(reasons)));
  }

  return allowed(clean);
}
