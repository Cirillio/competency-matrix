import type { UserProgress } from '../../types/progress';
import type { IStorageDriver, StorageOperationResult } from './IStorageDriver';

export interface SyncingDriverOptions {
  local: IStorageDriver;
  remote: IStorageDriver;
  debounceMs?: number;
}

export class SyncingStorageDriver implements IStorageDriver {
  private local: IStorageDriver;
  private remote: IStorageDriver;
  private debounceMs: number;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _lastRemoteError: string | null = null;

  constructor(options: SyncingDriverOptions) {
    this.local = options.local;
    this.remote = options.remote;
    this.debounceMs = options.debounceMs ?? 800;
  }

  get lastRemoteError(): string | null {
    return this._lastRemoteError;
  }

  async load(): Promise<UserProgress | null> {
    const localData = await this.local.load();
    const remoteData = await this.remote.load();

    if (remoteData && localData) {
      const localTime = new Date(localData.updatedAt).getTime();
      const remoteTime = new Date(remoteData.updatedAt).getTime();

      if (remoteTime > localTime) {
        // Remote is newer -> update local cache and return remote
        await this.local.save(remoteData);
        return remoteData;
      } else if (localTime > remoteTime) {
        // Local is newer -> push to remote and return local
        await this.remote.save(localData);
        return localData;
      }
      return localData;
    }

    if (remoteData && !localData) {
      await this.local.save(remoteData);
      return remoteData;
    }

    if (localData) {
      return localData;
    }

    return null;
  }

  async save(data: UserProgress): Promise<StorageOperationResult> {
    // 1. Synchronously save to local storage
    const localResult = await this.local.save(data);

    // 2. Debounced save to remote storage
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const remoteResult = await this.remote.save(data);
        if (!remoteResult.ok) {
          if (remoteResult.error !== 'supabase: no authenticated session') {
            this._lastRemoteError = remoteResult.error;
          } else {
            this._lastRemoteError = null;
          }
        } else {
          this._lastRemoteError = null;
        }
      } catch (err: unknown) {
        this._lastRemoteError = err instanceof Error ? err.message : 'Ошибка сохранения в Supabase';
      }
    }, this.debounceMs);

    return localResult;
  }

  async clear(): Promise<StorageOperationResult> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this._lastRemoteError = null;

    const [localRes, remoteRes] = await Promise.all([
      this.local.clear(),
      this.remote.clear(),
    ]);

    if (!localRes.ok) return localRes;
    if (!remoteRes.ok && remoteRes.error !== 'supabase: no authenticated session') {
      return remoteRes;
    }
    return { ok: true };
  }

  /**
   * Helper for immediate flush of pending debounced remote save (useful in unit tests).
   */
  async flush(data?: UserProgress): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (data) {
      const remoteResult = await this.remote.save(data);
      if (!remoteResult.ok && remoteResult.error !== 'supabase: no authenticated session') {
        this._lastRemoteError = remoteResult.error;
      } else {
        this._lastRemoteError = null;
      }
    }
  }
}
