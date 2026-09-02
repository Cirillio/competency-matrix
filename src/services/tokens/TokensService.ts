import { supabase } from '../supabase/client';

export interface ApiToken {
  tokenHash: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

export interface CreatedToken {
  /** Shown to the user exactly once — only the hash is stored. */
  token: string;
  record: ApiToken;
}

const PREFIX = 'cmx_';

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return PREFIX + hex;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface Row {
  token_hash: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

const toToken = (r: Row): ApiToken => ({
  tokenHash: r.token_hash,
  name: r.name,
  createdAt: r.created_at,
  lastUsedAt: r.last_used_at,
  revoked: r.revoked,
});

async function currentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export const TokensService = {
  async list(): Promise<ApiToken[]> {
    const { data, error } = await supabase
      .from('api_tokens')
      .select('token_hash, name, created_at, last_used_at, revoked')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('TokensService.list failed:', error);
      return [];
    }
    return (data as Row[]).map(toToken);
  },

  async create(name: string): Promise<CreatedToken | null> {
    const userId = await currentUserId();
    if (!userId) return null;

    const token = randomToken();
    const tokenHash = await sha256Hex(token);

    const { data, error } = await supabase
      .from('api_tokens')
      .insert({ token_hash: tokenHash, owner_id: userId, name })
      .select('token_hash, name, created_at, last_used_at, revoked')
      .single();

    if (error || !data) {
      console.error('TokensService.create failed:', error);
      throw new Error(error?.message ?? 'Не удалось создать токен');
    }
    return { token, record: toToken(data as Row) };
  },

  async revoke(tokenHash: string): Promise<void> {
    const { error } = await supabase
      .from('api_tokens')
      .update({ revoked: true })
      .eq('token_hash', tokenHash);
    if (error) throw new Error(error.message);
  },

  async remove(tokenHash: string): Promise<void> {
    const { error } = await supabase.from('api_tokens').delete().eq('token_hash', tokenHash);
    if (error) throw new Error(error.message);
  },
};
