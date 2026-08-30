import type { UserProgress } from '../../types/progress';

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type StorageOperationResult =
  | { ok: true }
  | { ok: false; error: string };

export interface IStorageDriver {
  load(): Promise<UserProgress | null>;
  save(data: UserProgress): Promise<StorageOperationResult>;
  clear(): Promise<StorageOperationResult>;
}
