/**
 * Detects external asset references a snippet needs but doesn't include — 3D
 * models, images, fonts, media — by scanning quoted strings and CSS url(...)
 * for known asset extensions. Absolute http(s) and data: URIs are already
 * loadable and excluded. Pure and deterministic.
 */
const ASSET_EXT =
  /\.(glb|gltf|fbx|obj|mtl|hdr|exr|png|jpe?g|webp|gif|svg|mp4|webm|ogg|mp3|wav|woff2?|ttf|otf|eot|bin)(\?[^"'`)\s]*)?$/i;

export function detectAssets(code: string): string[] {
  const found = new Set<string>();

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (/^data:/i.test(value)) return; // inline
    if (/^https?:\/\//i.test(value)) return; // already absolute/loadable
    if (ASSET_EXT.test(value)) found.add(value);
  };

  const stringRe = /["'`]([^"'`\n]+?)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = stringRe.exec(code))) add(m[1]);

  const urlRe = /url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi;
  while ((m = urlRe.exec(code))) add(m[1]);

  return Array.from(found).sort();
}
