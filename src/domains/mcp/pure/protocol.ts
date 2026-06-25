/**
 * A minimal, pure implementation of the MCP (Model Context Protocol) request
 * dispatch over JSON-RPC 2.0 — enough to expose read-only vault tools to an AI
 * coding agent (Claude Code, Cursor, Windsurf). Handles `initialize`,
 * `tools/list`, `tools/call`, `ping`, and the `notifications/initialized` ack.
 *
 * Transport + auth + DB live in the route; this layer is pure: it takes the
 * parsed message plus injected tool implementations and returns the JSON-RPC
 * response object (or null for a notification, which gets no response). That
 * keeps the whole protocol surface unit-testable without HTTP or a database.
 */

export const MCP_PROTOCOL_VERSION = '2025-06-18';
export const SERVER_INFO = { name: 'snapforge-vault', version: '1.0.0' } as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

/** The tool implementations the dispatcher calls. Owner-scoping happens in the
 * adapter that builds these; the protocol layer never sees a user id. */
export type ToolImpl = {
  search: (args: { query?: string; category?: string; limit?: number }) => Promise<unknown>;
  list: (args: { category?: string }) => Promise<unknown>;
  get: (args: { id?: string }) => Promise<unknown>;
};

export const TOOL_DEFS = [
  {
    name: 'search_vault',
    description:
      'Search the user’s saved component vault by keyword (matches name, tags, ' +
      'category). Use this to find components to build a UI from, e.g. "pricing ' +
      'card", "animated button", "hero". Returns lightweight summaries; call ' +
      'get_component for the actual code.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords to search for.' },
        category: { type: 'string', description: 'Optional category/subcategory filter.' },
        limit: { type: 'number', description: 'Max results (default 20).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_vault',
    description:
      'List the components in the user’s vault (optionally filtered to one ' +
      'category). Returns lightweight summaries; call get_component for the code.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category/subcategory filter.' },
      },
    },
  },
  {
    name: 'get_component',
    description:
      'Fetch one component’s export-ready code by id: its source (or multi-file ' +
      'map + entry path), npm dependencies, optional CSS and demo/usage. Everything ' +
      'needed to drop it into a project.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The component id.' } },
      required: ['id'],
    },
  },
] as const;

function ok(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}
function err(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

/** Wrap a tool's return value as MCP tool-call content (JSON text). */
function toolContent(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

/**
 * Dispatch one JSON-RPC message. Returns the response object, or null when the
 * message is a notification (no `id`) that needs no reply.
 */
export async function dispatchMcp(
  msg: JsonRpcRequest,
  impl: ToolImpl,
): Promise<JsonRpcResponse | null> {
  const id = msg.id ?? null;
  const method = msg.method;

  // Notifications (no id) are acknowledged with no response body.
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return null;
  }

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: TOOL_DEFS });

    case 'tools/call': {
      const params = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      const args = params.arguments ?? {};
      try {
        switch (params.name) {
          case 'search_vault':
            return ok(id, toolContent(await impl.search(args)));
          case 'list_vault':
            return ok(id, toolContent(await impl.list(args)));
          case 'get_component':
            return ok(id, toolContent(await impl.get(args)));
          default:
            return err(id, -32602, `Unknown tool: ${params.name}`);
        }
      } catch (e) {
        // Tool errors are reported as a result with isError so the agent sees them.
        return ok(id, {
          content: [{ type: 'text', text: `Error: ${(e as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return err(id, -32601, `Method not found: ${method ?? '(none)'}`);
  }
}
