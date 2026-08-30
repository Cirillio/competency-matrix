import type { UserProgress } from '../../types/progress';
import type { IStorageDriver, StorageOperationResult } from './IStorageDriver';

export class MemoryStorageDriver implements IStorageDriver {
  private data: UserProgress | null = null;
  private shouldFail = false;

  constructor(initialData: UserProgress | null = null) {
    this.data = initialData ? JSON.parse(JSON.stringify(initialData)) : null;
  }

  setSimulateFailure(fail: boolean) {
    this.shouldFail = fail;
  }

  async load(): Promise<UserProgress | null> {
    if (this.shouldFail) return null;
    return this.data ? JSON.parse(JSON.stringify(this.data)) : null;
  }

  async save(data: UserProgress): Promise<StorageOperationResult> {
    if (this.shouldFail) {
      return { ok: false, error: 'Simulated memory storage failure' };
    }
    this.data = JSON.parse(JSON.stringify(data));
    return { ok: true };
  }

  async clear(): Promise<StorageOperationResult> {
    if (this.shouldFail) {
      return { ok: false, error: 'Simulated clear failure' };
    }
    this.data = null;
    return { ok: true };
  }
}
