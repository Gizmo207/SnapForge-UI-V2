/**
 * Pure helpers for ingesting a component from a shadcn-style registry — the way
 * Aceternity, Magic UI, shadcn, Origin UI, 21st.dev, etc. actually distribute
 * components ("run `npx shadcn add …`"). The page rarely shows the source; the
 * source lives in a registry JSON the CLI downloads. These helpers let us accept
 * that install command (or the raw registry URL) and turn the JSON into the
 * `{ path: content }` file map our multi-file pipeline already understands.
 *
 * Everything here is pure and deterministic. The actual network fetch + recursive
 * resolution lives in `src/adapters/registry/resolveRegistry.ts`, which injects a
 * fetcher so this layer stays testable.
 */

/** Namespace → URL template for the registries we know how to resolve by name
 * (`@aceternity/3d-globe`). A full `.json` URL never needs this. Best-effort:
 * unknown namespaces fall through to a clear error in the adapter. */
export const KNOWN_REGISTRIES: Record<string, (name: string) => string> = {
  shadcn: (n) => `https://ui.shadcn.com/r/${n}.json`,
  magicui: (n) => `https://magicui.design/r/${n}.json`,
  aceternity: (n) => `https://ui.aceternity.com/registry/${n}.json`,
  originui: (n) => `https://originui.com/r/${n}.json`,
  origin: (n) => `https://originui.com/r/${n}.json`,
};

/** A single shadcn registry file entry. `content` may be absent in older/registry
 * index formats (which only list a path); we can only ingest files with content. */
export type RegistryFile = {
  path?: string;
  content?: string;
  type?: string;
  target?: string;
};

export type RegistryItem = {
  name?: string;
  type?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<RegistryFile | string>;
};

/**
 * Pull the install targets out of a pasted string. Accepts:
 *   - a CLI command: `npx shadcn@latest add <a> <b>`, `pnpm dlx shadcn add …`,
 *     `bunx --bun shadcn@latest add …`, `yarn dlx shadcn add …`
 *   - one or more bare registry refs / URLs on their own (whitespace-separated)
 * Returns the list of refs (URLs, `@ns/name`, or bare names), or null when the
 * text isn't a registry install at all (so the caller falls back to normal paste).
 */
export function parseRegistryInput(text: string): string[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // CLI form: everything after the `add` keyword, minus flags.
  const addMatch = trimmed.match(/\b(?:shadcn|shadcn-ui)(?:@[\w.-]+)?\s+add\s+([^\n]+)/i);
  if (addMatch) {
    const refs = tokenize(addMatch[1]);
    return refs.length ? refs : null;
  }

  // Bare URL(s) to a registry JSON, possibly several lines.
  if (/^https?:\/\/\S+\.json(\s|$)/i.test(trimmed) || /^https?:\/\/\S+$/.test(trimmed)) {
    const refs = tokenize(trimmed).filter((r) => /^https?:\/\//i.test(r) && /\.json($|\?)/i.test(r));
    return refs.length ? refs : null;
  }

  // A lone namespaced ref pasted on its own, e.g. `@magicui/marquee`. (A bare
  // single word like `button` is too ambiguous to treat as a registry ref.)
  if (/^@[\w.-]+\/[\w./@-]+$/.test(trimmed)) return [trimmed];

  return null;
}

/** Split an arg string into refs, dropping CLI flags (`--yes`, `-o`, `--overwrite`). */
function tokenize(args: string): string[] {
  return args
    .split(/\s+/)
    .map((t) => t.replace(/^["']|["']$/g, '').trim())
    .filter((t) => t.length > 0 && !t.startsWith('-'));
}

/** Resolve a single ref to a fetchable URL. Full URLs pass through; `@ns/name`
 * uses the known-registry templates; a bare name defaults to the shadcn registry.
 * Returns null for an unknown namespace we can't map. */
export function refToUrl(ref: string): string | null {
  if (/^https?:\/\//i.test(ref)) return ref;

  if (ref.startsWith('@')) {
    const slash = ref.indexOf('/');
    if (slash < 0) return null;
    const ns = ref.slice(1, slash);
    const name = ref.slice(slash + 1);
    const tmpl: ((n: string) => string) | undefined = KNOWN_REGISTRIES[ns.toLowerCase()];
    return tmpl !== undefined && name ? tmpl(name) : null;
  }

  // Bare name → default shadcn registry.
  return KNOWN_REGISTRIES.shadcn(ref);
}

/** A registry dependency ref resolved against the URL of the item that declared
 * it: a full URL stays; a bare name is fetched from the same registry base. */
export function resolveDependencyUrl(dep: string, parentUrl: string): string | null {
  if (/^https?:\/\//i.test(dep)) return dep;
  if (dep.startsWith('@')) return refToUrl(dep);
  // Bare name: same directory as the parent item (…/r/<name>.json).
  try {
    const base = new URL(parentUrl);
    const dir = base.pathname.replace(/\/[^/]*$/, '');
    return `${base.origin}${dir}/${dep}.json`;
  } catch {
    return null;
  }
}

/**
 * Map a registry file to a sandbox path under the conventional layout
 * (`components/ui/x.tsx`, `lib/utils.ts`, `hooks/use-x.ts`) so that the `@/…`
 * alias imports inside the component resolve against our multi-file pipeline.
 * Uses `target`/`path` when they already carry a folder, else derives from `type`.
 */
export function placeRegistryFile(file: RegistryFile): string | null {
  const raw = (file.target || file.path || '').replace(/\\/g, '/').replace(/^\.?\/+/, '');
  if (!raw) return null;
  const base = raw.split('/').pop() as string;

  // Already namespaced with a known root folder — keep it.
  if (/(^|\/)(components|lib|hooks|app|src)\//.test('/' + raw)) {
    return raw.replace(/^src\//, '');
  }

  switch (file.type) {
    case 'registry:ui':
      return raw.includes('/') ? `components/${raw}` : `components/ui/${base}`;
    case 'registry:component':
    case 'registry:block':
      return `components/${base}`;
    case 'registry:lib':
      return `lib/${base}`;
    case 'registry:hook':
      return `hooks/${base}`;
    default:
      // Fall back to whatever folder the path carried, else drop at components/.
      return raw.includes('/') ? raw : `components/${base}`;
  }
}

/** Extract usable files (those with inline content) + dep lists from one item. */
export function extractRegistryItem(item: RegistryItem): {
  files: Record<string, string>;
  dependencies: string[];
  registryDependencies: string[];
} {
  const files: Record<string, string> = {};
  for (const f of item.files ?? []) {
    if (typeof f === 'string') continue; // index-only entry, no content to ingest
    if (typeof f.content !== 'string' || !f.content.trim()) continue;
    const path = placeRegistryFile(f);
    if (path) files[path] = f.content;
  }
  return {
    files,
    dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
    registryDependencies: Array.isArray(item.registryDependencies)
      ? item.registryDependencies.filter((d): d is string => typeof d === 'string')
      : [],
  };
}

/** Narrow unknown JSON to a RegistryItem (shape guard for the fetched payload). */
export function asRegistryItem(json: unknown): RegistryItem | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  if (!Array.isArray(obj.files)) return null;
  return obj as RegistryItem;
}
