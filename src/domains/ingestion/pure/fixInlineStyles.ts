/**
 * Repairs a common JSX mistake that makes a component unparseable (so it can't be
 * gated or rendered): a CSS custom property used as an UNQUOTED key in an inline
 * style object, e.g. `style={{-angle: '30deg'}}` or `style={{--x: '1px'}}`. In JS
 * an object key starting with `-` must be a quoted string, and a CSS variable
 * needs two dashes — a single leading dash is always a typo for `--`. We quote it
 * and normalize to `--`.
 *
 * Scoped to JSX `style={{ … }}` objects, so a styled-components template literal
 * (which legitimately writes `--x:` as a CSS declaration) is never touched. Pure
 * and deterministic; a no-op when there's nothing to fix.
 */
export function fixInlineStyleVars(code: string): string {
  return code.replace(/style=\{\{([^{}]*)\}\}/g, (whole, inner: string) => {
    const fixed = inner.replace(
      /(^|,)(\s*)-{1,2}([A-Za-z][\w-]*)(\s*:)/g,
      (_m, pre: string, ws: string, name: string, colon: string) => `${pre}${ws}'--${name}'${colon}`,
    );
    return fixed === inner ? whole : `style={{${fixed}}}`;
  });
}
