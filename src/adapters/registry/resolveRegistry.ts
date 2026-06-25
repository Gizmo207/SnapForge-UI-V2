/**
 * Resolves a pasted shadcn-style install command / registry URL into a flat
 * `{ path: content }` file map ready for the multi-file capture pipeline. Walks
 * `registryDependencies` recursively (bounded) so a component's `cn` helper,
 * sub-components, etc. all come along. The HTTP fetch is injected so the
 * recursion logic is unit-testable without the network.
 */

import {
  parseRegistryInput,
  refToUrl,
  resolveDependencyUrl,
  extractRegistryItem,
  asRegistryItem,
} from '../../domains/ingestion/pure/registrySpec';

export type RegistryFetcher = (url: string) => Promise<unknown>;

export type ResolvedRegistry = {
  files: Record<string, string>;
  dependencies: string[];
};

const MAX_ITEMS = 60; // guardrail: a component + its deps, never a whole library
const MAX_DEPTH = 4;

/** True when a paste is a registry install command / URL rather than source. */
export function looksLikeRegistryInput(text: string): boolean {
  return parseRegistryInput(text) !== null;
}

export async function resolveRegistry(
  input: string,
  fetchJson: RegistryFetcher,
): Promise<ResolvedRegistry> {
  const refs = parseRegistryInput(input);
  if (!refs || refs.length === 0) {
    throw new Error(
      'That doesn’t look like a registry command or URL. Paste something like ' +
        '`npx shadcn@latest add <name-or-url>` or a registry `.json` URL.',
    );
  }

  const seed: string[] = [];
  for (const ref of refs) {
    const url = refToUrl(ref);
    if (!url) {
      throw new Error(
        `Couldn’t resolve "${ref}". Use a full registry .json URL, a known namespace ` +
          `(@shadcn, @magicui, @aceternity, @originui), or paste the component source directly.`,
      );
    }
    seed.push(url);
  }

  const files: Record<string, string> = {};
  const deps = new Set<string>();
  const visited = new Set<string>();
  // Breadth-first over the dependency graph with a depth bound.
  let frontier = seed.map((url) => ({ url, depth: 0 }));

  while (frontier.length > 0) {
    if (visited.size >= MAX_ITEMS) break;
    const next: typeof frontier = [];

    for (const { url, depth } of frontier) {
      if (visited.has(url) || visited.size >= MAX_ITEMS) continue;
      visited.add(url);

      let json: unknown;
      try {
        json = await fetchJson(url);
      } catch (e) {
        // The seed (what the user actually pasted) failing is fatal; a transitive
        // dependency failing is tolerated so we still ingest the main component.
        if (depth === 0) {
          throw new Error(`Couldn’t fetch the registry item at ${url}: ${(e as Error).message}`);
        }
        continue;
      }

      const item = asRegistryItem(json);
      if (!item) {
        if (depth === 0) {
          throw new Error(
            `The response from ${url} isn’t a shadcn registry item (no "files" array). ` +
              `If it needs authentication (a paid “All-Access” registry), it can’t be fetched.`,
          );
        }
        continue;
      }

      const { files: f, dependencies, registryDependencies } = extractRegistryItem(item);
      Object.assign(files, f);
      for (const d of dependencies) deps.add(d);

      if (depth < MAX_DEPTH) {
        for (const dep of registryDependencies) {
          const depUrl = resolveDependencyUrl(dep, url);
          if (depUrl && !visited.has(depUrl)) next.push({ url: depUrl, depth: depth + 1 });
        }
      }
    }

    frontier = next;
  }

  if (Object.keys(files).length === 0) {
    throw new Error(
      'The registry item had no inline file content to import. Some registries only ' +
        'serve file paths (not source) or require authentication.',
    );
  }

  return { files, dependencies: Array.from(deps).sort() };
}

/** Default network fetcher: GET the URL and parse JSON, with a sane UA + guardrails. */
export async function httpFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'SnapForgeUI/1.0 (+registry-import)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > 6_000_000) throw new Error('registry response too large');
  return JSON.parse(text);
}
