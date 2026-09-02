import { supabase } from '../supabase/client';
import { storedPackSchema, type MatrixPack, type StoredPack } from '../../types/matrixPack';

const CACHE_KEY = 'matrix_packs_cache_v1';

function readCache(): StoredPack[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = storedPackSchema.array().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function writeCache(packs: StoredPack[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(packs));
  } catch {
    /* quota / private mode — cache is best-effort */
  }
}

interface PackRow {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  data: { skills?: unknown };
  created_at: string;
}

function rowToStored(row: PackRow): StoredPack {
  return storedPackSchema.parse({
    id: row.id,
    name: row.name,
    version: row.version,
    enabled: row.enabled,
    skills: row.data?.skills ?? [],
    createdAt: row.created_at,
  });
}

async function currentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Talks to `public.matrix_packs` directly (RLS keeps it owner-scoped) and keeps
 * a localStorage mirror so the tracker can read packs offline. Every method is
 * inert without a session — the tracker is behind auth, so that only happens
 * mid-sign-out.
 */
export const PacksService = {
  async list(): Promise<StoredPack[]> {
    const userId = await currentUserId();
    if (!userId) return readCache();

    const { data, error } = await supabase
      .from('matrix_packs')
      .select('id, name, version, enabled, data, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('PacksService.list failed:', error);
      return readCache();
    }

    const packs = (data as PackRow[]).map(rowToStored);
    writeCache(packs);
    return packs;
  },

  async create(pack: MatrixPack): Promise<StoredPack | null> {
    const userId = await currentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('matrix_packs')
      .insert({
        owner_id: userId,
        name: pack.name,
        version: pack.version,
        enabled: true,
        data: { skills: pack.skills },
      })
      .select('id, name, version, enabled, data, created_at')
      .single();

    if (error || !data) {
      console.error('PacksService.create failed:', error);
      throw new Error(error?.message ?? 'Не удалось сохранить набор');
    }
    return rowToStored(data as PackRow);
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const { error } = await supabase.from('matrix_packs').update({ enabled }).eq('id', id);
    if (error) {
      console.error('PacksService.setEnabled failed:', error);
      throw new Error(error.message);
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('matrix_packs').delete().eq('id', id);
    if (error) {
      console.error('PacksService.remove failed:', error);
      throw new Error(error.message);
    }
  },

  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  },
};
