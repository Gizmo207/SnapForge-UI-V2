import type { Component } from '../../shared/component';
import { detectAssets } from '../../ingestion/pure/detectAssets';

export type BundleFile = {
  path: string;
  contents: string;
};

/** An asset file to fetch (server-side) and place in the zip so the export is self-contained. */
export type BundleAsset = {
  /** Where it lands in the zip, e.g. public/assets/3d/lens.glb. */
  path: string;
  /** Source to fetch the bytes from (our storage URL or a user-supplied URL). */
  url: string;
};

export type ExportBundle = {
  files: BundleFile[];
  /** Asset files to bundle alongside the code. */
  assets: BundleAsset[];
  /** Referenced asset paths the user never provided (component may not work). */
  missingAssets: { component: string; refPath: string }[];
  /** Components excluded because they did not pass the sanitization gate. */
  excludedUnsafe: string[];
  /** Components excluded because the framework-appropriate artifact was missing. */
  missingArtifact: string[];
  isEmpty: boolean;
};

/** Maps a referenced path to its location inside the bundle's public/ folder. */
function assetZipPath(refPath: string): string {
  const cleaned = refPath.replace(/^\.?\//, '').replace(/^\.\.\//g, '').split('?')[0];
  return `public/${cleaned}`;
}

function slug(component: Component): string {
  return (
    component.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || component.componentId
  );
}

/**
 * Pure export logic. Builds a deterministic set of files from the selected
 * components.
 *
 * Invariants (see build_anything_protocol/06_decision_rules/export.md):
 *  - Only components whose sanitizationOutcome === 'allowed' may contribute
 *    files. Export honors the gate; it never re-judges safety.
 *  - A component lacking the framework-appropriate artifact is reported missing
 *    and excluded, never emitted empty.
 *  - Same selection -> same bundle. Empty is a valid, explicit outcome.
 */
export function buildExportBundle(selected: Component[]): ExportBundle {
  const excludedUnsafe: string[] = [];
  const missingArtifact: string[] = [];
  const files: BundleFile[] = [];
  const assetsByPath = new Map<string, BundleAsset>();
  const missingAssets: { component: string; refPath: string }[] = [];

  // React components -> one react.tsx each.
  const reactSections: BundleFile[] = [];
  // HTML components -> combined index.html + styles.css.
  const htmlBodies: string[] = [];
  const cssBlocks: string[] = [];

  for (const component of selected) {
    if (component.sanitizationOutcome !== 'allowed') {
      excludedUnsafe.push(component.name);
      continue;
    }

    if (component.framework === 'react') {
      // Multi-file component (uploaded folder/zip): emit the whole tree under
      // react/<slug>/, preserving paths and the original imports so it drops
      // straight into a project.
      if (component.files && Object.keys(component.files).length > 0) {
        for (const [p, contents] of Object.entries(component.files)) {
          reactSections.push({ path: `react/${slug(component)}${p}`, contents });
        }
      } else {
        const artifact = (component.sanitizedArtifact ?? '').trim();
        if (!artifact) {
          missingArtifact.push(component.name);
          continue;
        }
        const css = (component.cssSource ?? '').trim();
        const cssImport = css ? `import './${slug(component)}.css';\n` : '';
        reactSections.push({
          path: `react/${slug(component)}.tsx`,
          contents: `// ${component.name}\n${cssImport}${artifact}\n`,
        });
        if (css) {
          reactSections.push({ path: `react/${slug(component)}.css`, contents: `${css}\n` });
        }
      }
    } else {
      const html = (component.htmlSource ?? component.sanitizedArtifact ?? '').trim();
      if (!html) {
        missingArtifact.push(component.name);
        continue;
      }
      htmlBodies.push(`  <!-- ${component.name} -->\n${indent(html, 2)}`);
      const css = (component.cssSource ?? '').trim();
      if (css) cssBlocks.push(`/* ${component.name} */\n${css}`);
    }

    // This component contributed; bundle the asset files it references so the
    // export is self-contained. A referenced path with no provided file is
    // reported as missing rather than silently producing a broken download.
    const provided = new Map((component.assets ?? []).map((a) => [a.refPath, a.url]));
    for (const refPath of detectAssets(component.source)) {
      const url = provided.get(refPath);
      if (url) {
        const path = assetZipPath(refPath);
        if (!assetsByPath.has(path)) assetsByPath.set(path, { path, url });
      } else {
        missingAssets.push({ component: component.name, refPath });
      }
    }
  }

  files.push(...reactSections);

  if (htmlBodies.length > 0) {
    files.push({
      path: 'html/index.html',
      contents: buildIndexHtml(htmlBodies),
    });
    files.push({
      path: 'html/styles.css',
      contents: cssBlocks.length > 0 ? cssBlocks.join('\n\n') + '\n' : '/* No CSS variants provided. */\n',
    });
  }

  const assets = Array.from(assetsByPath.values()).sort((a, b) => a.path.localeCompare(b.path));

  return {
    files,
    assets,
    missingAssets,
    excludedUnsafe,
    missingArtifact,
    isEmpty: files.length === 0,
  };
}

function indent(text: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function buildIndexHtml(bodies: string[]): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Components</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
${bodies.join('\n\n')}
</body>
</html>
`;
}
