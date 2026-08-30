import type { UserProgress } from '../../types/progress';
import { userProgressSchema } from '../../types/progress';
import type { IStorageDriver, StorageOperationResult } from './IStorageDriver';

const STORAGE_KEY = 'matrix_progress_v2';
const LEGACY_STORAGE_KEY = 'cdek_matrix_progress_v2';

export class LocalStorageDriver implements IStorageDriver {
  private key: string;

  constructor(key = STORAGE_KEY) {
    this.key = key;
  }

  async load(): Promise<UserProgress | null> {
    try {
      let raw = localStorage.getItem(this.key);

      // Transparent one-time migration from legacy key
      if (!raw && this.key === STORAGE_KEY) {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          raw = legacyRaw;
          localStorage.setItem(this.key, legacyRaw);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }

      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const validation = userProgressSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }
      console.warn('LocalStorage data failed schema validation, ignoring corrupted data.');
      return null;
    } catch {
      return null;
    }
  }

  async save(data: UserProgress): Promise<StorageOperationResult> {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка записи в LocalStorage';
      console.error('LocalStorageDriver save failed:', err);
      return { ok: false, error: message };
    }
  }

  async clear(): Promise<StorageOperationResult> {
    try {
      localStorage.removeItem(this.key);
      if (this.key === STORAGE_KEY) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка очистки LocalStorage';
      console.error('LocalStorageDriver clear failed:', err);
      return { ok: false, error: message };
    }
  }
}
