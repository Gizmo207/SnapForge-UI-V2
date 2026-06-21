import { Parser } from 'htmlparser2';
import { allowed, blocked, type SanitizationDecision } from './types';

/**
 * HTML sanitization gate. Parses the markup with htmlparser2 (a pure, no-DOM
 * parser) and walks it for dangerous constructs — never raw string scans, and
 * no jsdom/DOMPurify (which broke serverless bundling). Default-deny: any
 * dangerous element/attribute blocks the snippet. Clean markup is ALLOWED with
 * the original source as the artifact.
 */

const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'base', 'meta', 'link',
  'frame', 'frameset', 'applet', 'noscript',
]);

// Attributes whose value is treated as a URL.
const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'srcdoc', 'background', 'poster']);

const UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;

export function htmlGate(source: string): SanitizationDecision {
  if (!source.trim()) return blocked(['empty source']);

  const reasons = new Set<string>();

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tag = name.toLowerCase();
        if (DANGEROUS_TAGS.has(tag)) {
          reasons.add(`disallowed element: <${tag}>`);
        }
        for (const [rawKey, value] of Object.entries(attribs)) {
          const key = rawKey.toLowerCase();
          if (key.startsWith('on')) {
            reasons.add(`event-handler attribute: ${key}`);
          } else if (URL_ATTRS.has(key) && UNSAFE_URL.test(value)) {
            reasons.add(`unsafe URL in ${key}`);
          } else if (key === 'style' && /expression\(|javascript:/i.test(value)) {
            reasons.add('unsafe style');
          }
        }
      },
      onprocessinginstruction(name) {
        // e.g. <?php ... ?> or <?xml ...> — not valid in an HTML snippet.
        if (name) reasons.add('processing instruction');
      },
    },
    { lowerCaseTags: true, lowerCaseAttributeNames: true, recognizeSelfClosing: true },
  );

  parser.write(source);
  parser.end();

  if (reasons.size > 0) return blocked(Array.from(reasons));
  return allowed(source);
}
