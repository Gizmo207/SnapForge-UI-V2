/**
 * A human label for an asset slot, inferred from its reference path. Components
 * reference assets by cryptic placeholder paths (e.g. `/path/to/avatar.jpg`,
 * `/assets/demo/iconpattern.png`) that don't tell a user what the file is *for*,
 * which leads to uploading the right image into the wrong slot. This maps the
 * path to a plain-English purpose. Pure and deterministic.
 */
export function assetLabel(refPath: string): string {
  const p = refPath.toLowerCase();
  const base = refPath.split(/[\\/]/).pop() || refPath;

  if (/avatar|profile|headshot|portrait|\bphoto\b|\bface\b/.test(p)) return 'Profile photo / avatar';
  if (/(icon.?pattern|sparkle|holo|glitter)/.test(p)) return 'Holographic overlay texture (optional)';
  if (/grain|noise/.test(p)) return 'Grain texture (optional)';
  if (/favicon|\bicon\b/.test(p)) return 'Icon';
  if (/logo/.test(p)) return 'Logo';
  if (/(^|[-_/])bg|background|hero|cover|banner/.test(p)) return 'Background image';
  if (/\.(glb|gltf|fbx|obj|mtl|bin)$/i.test(base)) return '3D model';
  if (/\.(woff2?|ttf|otf|eot)$/i.test(base)) return 'Font';
  if (/\.(mp4|webm|ogv)$/i.test(base)) return 'Video';
  if (/\.(mp3|wav|ogg)$/i.test(base)) return 'Audio';
  if (/\.svg$/i.test(base)) return 'SVG graphic';
  if (/\.(png|jpe?g|webp|gif|avif)$/i.test(base)) return 'Image';
  return base;
}
