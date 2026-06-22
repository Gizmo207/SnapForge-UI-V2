/**
 * Recognizes when pasted "source" is actually a bare CSS stylesheet rather than
 * a component (JSX/HTML). React Bits / uiverse components ship as separate files
 * — a .jsx/.tsx and a .css — and it's easy to paste the .css into the main code
 * box by mistake. That yields a component whose markup is missing entirely, so
 * the preview renders the stylesheet as literal text. Catching it up front lets
 * us tell the user to put the CSS in the dedicated field instead.
 *
 * Heuristic: the snippet has CSS rule blocks but shows no sign of JS or markup.
 */
export function looksLikeOnlyCss(code: string): boolean {
  const c = code.trim();
  if (!c) return false;

  // Any HTML/JSX tag (e.g. <div>, <ProfileCard ...) → it's a real component.
  if (/<[A-Za-z][\w-]*[\s/>]/.test(c)) return false;
  // Any JS/JSX signal (imports, a render return, an arrow/function) → not CSS.
  if (/\b(import|export|function|return)\b|=>/.test(c)) return false;

  // CSS signal: at least one `selector { … : … }` rule, an @-rule, or a
  // custom-property declaration like the `:root { --x: … }` these cards open with.
  return /[^{}]+\{[^{}]*:[^{}]*\}/.test(c) || /@(media|keyframes|property|supports|font-face)\b/.test(c);
}
