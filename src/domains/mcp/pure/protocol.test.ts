import { describe, it, expect } from 'vitest';
import { dispatchMcp, TOOL_DEFS, MCP_PROTOCOL_VERSION, type ToolImpl } from './protocol';

const impl: ToolImpl = {
  search: async (a) => ({ called: 'search', args: a }),
  list: async (a) => ({ called: 'list', args: a }),
  get: async (a) => ({ called: 'get', args: a }),
};

describe('dispatchMcp', () => {
  it('handles initialize with protocol version + server info', async () => {
    const r = await dispatchMcp({ jsonrpc: '2.0', id: 1, method: 'initialize' }, impl);
    expect(r).not.toBeNull();
    const result = r!.result as { protocolVersion: string; serverInfo: { name: string } };
    expect(result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
    expect(result.serverInfo.name).toBe('snapforge-vault');
  });

  it('returns null (no reply) for the initialized notification', async () => {
    const r = await dispatchMcp({ jsonrpc: '2.0', method: 'notifications/initialized' }, impl);
    expect(r).toBeNull();
  });

  it('lists the three vault tools', async () => {
    const r = await dispatchMcp({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, impl);
    const names = (r!.result as { tools: { name: string }[] }).tools.map((t) => t.name);
    expect(names).toEqual(['search_vault', 'list_vault', 'get_component']);
    expect(TOOL_DEFS).toHaveLength(3);
  });

  it('routes tools/call to the matching impl and wraps the result as text content', async () => {
    const r = await dispatchMcp(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'search_vault', arguments: { query: 'button' } } },
      impl,
    );
    const result = r!.result as { content: { type: string; text: string }[] };
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual({ called: 'search', args: { query: 'button' } });
  });

  it('reports a tool throwing as an isError result, not a transport error', async () => {
    const throwing: ToolImpl = { ...impl, get: async () => { throw new Error('no such component'); } };
    const r = await dispatchMcp(
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_component', arguments: { id: 'x' } } },
      throwing,
    );
    const result = r!.result as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no such component');
  });

  it('errors on an unknown tool name', async () => {
    const r = await dispatchMcp(
      { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'nope' } },
      impl,
    );
    expect(r!.error?.code).toBe(-32602);
  });

  it('errors on an unknown method', async () => {
    const r = await dispatchMcp({ jsonrpc: '2.0', id: 6, method: 'frobnicate' }, impl);
    expect(r!.error?.code).toBe(-32601);
  });

  it('answers ping', async () => {
    const r = await dispatchMcp({ jsonrpc: '2.0', id: 7, method: 'ping' }, impl);
    expect(r!.result).toEqual({});
  });
});
