import type { UserProgress } from '../../types/progress';
import { userProgressSchema } from '../../types/progress';
import type { IStorageDriver, StorageOperationResult } from './IStorageDriver';
import { supabase } from '../supabase/client';

const NO_SESSION: StorageOperationResult = {
  ok: false,
  error: 'supabase: no authenticated session',
};

/**
 * Persists the whole UserProgress blob as one row in `public.progress`
 * (`user_id` = current auth user, `data` jsonb). Row Level Security guarantees
 * a user only ever touches their own row.
 *
 * Requires an authenticated session. When signed out every method is inert
 * (`load` → null, writes → { ok: false }) so a composing driver can fall back
 * to local storage — see SPEC §6 offline requirement.
 */
export class SupabaseStorageDriver implements IStorageDriver {
  private async currentUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }

  async load(): Promise<UserProgress | null> {
    const userId = await this.currentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('progress')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('SupabaseStorageDriver load failed:', error);
      return null;
    }

    const validation = userProgressSchema.safeParse(data?.data);
    if (!validation.success) {
      if (data?.data != null) {
        console.warn('Supabase progress row failed schema validation, ignoring.');
      }
      return null;
    }
    return validation.data;
  }

  async save(data: UserProgress): Promise<StorageOperationResult> {
    const userId = await this.currentUserId();
    if (!userId) return NO_SESSION;

    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: userId, data }, { onConflict: 'user_id' });

    if (error) {
      console.error('SupabaseStorageDriver save failed:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  async clear(): Promise<StorageOperationResult> {
    const userId = await this.currentUserId();
    if (!userId) return NO_SESSION;

    const { error } = await supabase.from('progress').delete().eq('user_id', userId);
    if (error) {
      console.error('SupabaseStorageDriver clear failed:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }
}
