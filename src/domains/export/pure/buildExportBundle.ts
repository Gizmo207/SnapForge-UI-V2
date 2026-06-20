import type { Component } from '../../shared/component';

export type BundleFile = {
  path: string;
  contents: string;
};

export type ExportBundle = {
  files: BundleFile[];
  /** Components excluded because they did not pass the sanitization gate. */
  excludedUnsafe: string[];
  /** Components excluded because the framework-appropriate artifact was missing. */
  missingArtifact: string[];
  isEmpty: boolean;
};

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
      const artifact = (component.sanitizedArtifact ?? '').trim();
      if (!artifact) {
        missingArtifact.push(component.name);
        continue;
      }
      reactSections.push({
        path: `react/${slug(component)}.tsx`,
        contents: `// ${component.name}\n${artifact}\n`,
      });
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

  return {
    files,
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
