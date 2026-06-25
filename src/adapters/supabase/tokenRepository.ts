import { getSupabaseServerClient } from './client';
import { generateApiToken, hashApiToken } from '../auth/apiToken';

/**
 * I/O adapter for MCP personal access tokens. Stores only the token hash; the
 * raw token is returned once at creation and never persisted. All lookups resolve
 * a presented token to its owner id, which then scopes every vault query.
 */

export type TokenInfo = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
};

/** Creates a token for the owner and returns the RAW token (shown once). */
export async function createApiToken(ownerId: string, label: string): Promise<{ token: string; info: TokenInfo }> {
  const supabase = getSupabaseServerClient();
  const token = generateApiToken();
  const { data, error } = await supabase
    .from('api_tokens')
    .insert({ owner_id: ownerId, token_hash: hashApiToken(token), label: label || 'MCP token' })
    .select('id, label, created_at, last_used_at')
    .single();
  if (error) throw new Error(`createApiToken failed: ${error.message}`);
  return {
    token,
    info: { id: data.id, label: data.label, createdAt: data.created_at, lastUsedAt: data.last_used_at },
  };
}

/** Resolves a presented raw token to its owner id, or null if unknown. Updates
 * last_used_at as a side effect (best-effort). */
export async function ownerForToken(token: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const hash = hashApiToken(token);
  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, owner_id')
    .eq('token_hash', hash)
    .maybeSingle();
  if (error || !data) return null;
  // Best-effort touch; never block auth on it.
  void supabase.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data.owner_id as string;
}

export async function listApiTokens(ownerId: string): Promise<TokenInfo[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, label, created_at, last_used_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listApiTokens failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export async function revokeApiToken(id: string, ownerId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('api_tokens').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) throw new Error(`revokeApiToken failed: ${error.message}`);
}
