import { NextResponse } from 'next/server';
import { dispatchMcp, type JsonRpcRequest, type ToolImpl } from '@/domains/mcp/pure/protocol';
import { toSummary, toPayload, matchesQuery } from '@/domains/mcp/pure/shape';
import { looksLikeApiToken } from '@/adapters/auth/apiToken';
import { ownerForToken } from '@/adapters/supabase/tokenRepository';
import {
  listComponents,
  listComponentsByCategory,
  getComponentsByIds,
} from '@/adapters/supabase/vaultRepository';

export const runtime = 'nodejs';

/**
 * Remote MCP server (Streamable HTTP, JSON responses) exposing the signed-in
 * user's component vault, read-only, to AI coding agents. Auth is a per-user
 * personal access token in the Authorization header; it resolves to an owner id
 * that scopes every tool call. Protocol dispatch is the pure `dispatchMcp`.
 */

function bearer(request: Request): string | null {
  const h = request.headers.get('authorization') ?? '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/** Build owner-scoped tool implementations for the dispatcher. */
function toolsForOwner(ownerId: string): ToolImpl {
  return {
    async search({ query = '', category, limit = 20 }) {
      const all = category
        ? await listComponentsByCategory(ownerId, category)
        : await listComponents(ownerId);
      const hits = all
        .filter((c) => c.sanitizationOutcome === 'allowed')
        .filter((c) => matchesQuery(c, query))
        .slice(0, Math.max(1, Math.min(100, limit)));
      return { count: hits.length, components: hits.map(toSummary) };
    },
    async list({ category }) {
      const all = category
        ? await listComponentsByCategory(ownerId, category)
        : await listComponents(ownerId);
      const usable = all.filter((c) => c.sanitizationOutcome === 'allowed');
      return { count: usable.length, components: usable.map(toSummary) };
    },
    async get({ id }) {
      if (!id) throw new Error('id is required');
      const [c] = await getComponentsByIds([id], ownerId);
      if (!c) throw new Error(`No component ${id} in your vault.`);
      return toPayload(c);
    },
  };
}

export async function POST(request: Request) {
  const token = bearer(request);
  if (!token || !looksLikeApiToken(token)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized: missing or malformed token' } },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
    );
  }

  const ownerId = await ownerForToken(token);
  if (!ownerId) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized: unknown token' } },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
    );
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    );
  }

  const impl = toolsForOwner(ownerId);

  // Support a JSON-RPC batch as well as a single message.
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((m) => dispatchMcp(m, impl)))).filter(Boolean);
    return responses.length ? NextResponse.json(responses) : new NextResponse(null, { status: 204 });
  }

  const response = await dispatchMcp(body, impl);
  return response ? NextResponse.json(response) : new NextResponse(null, { status: 204 });
}

// A bare GET is handy for a quick "is it up?" check from a browser.
export function GET() {
  return NextResponse.json({
    server: 'snapforge-vault',
    transport: 'streamable-http',
    hint: 'POST JSON-RPC with Authorization: Bearer <sf_ token>. Tools: search_vault, list_vault, get_component.',
  });
}
