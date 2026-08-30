import type { IStorageDriver } from './IStorageDriver';
import { LocalStorageDriver } from './LocalStorageDriver';
import { SupabaseStorageDriver } from './SupabaseStorageDriver';
import { SyncingStorageDriver } from './SyncingStorageDriver';
import { isSupabaseConfigured } from '../supabase/client';

export * from './IStorageDriver';
export * from './LocalStorageDriver';
export * from './MemoryStorageDriver';
export * from './SupabaseStorageDriver';
export * from './SyncingStorageDriver';

export function createStorageDriver(): IStorageDriver {
  if (isSupabaseConfigured) {
    return new SyncingStorageDriver({
      local: new LocalStorageDriver(),
      remote: new SupabaseStorageDriver(),
    });
  }
  return new LocalStorageDriver();
}
