import { describe, it, expect, beforeEach } from 'vitest';
import { SyncingStorageDriver } from '../../src/services/storage/SyncingStorageDriver';
import { MemoryStorageDriver } from '../../src/services/storage/MemoryStorageDriver';
import type { UserProgress } from '../../src/types/progress';

describe('SyncingStorageDriver', () => {
  let localDriver: MemoryStorageDriver;
  let remoteDriver: MemoryStorageDriver;

  const olderProgress: UserProgress = {
    version: '2.0.0',
    updatedAt: '2026-08-31T00:00:00.000Z',
    completedSkills: {
      'git-e1.1-ui-client': { completed: true },
    },
  };

  const newerProgress: UserProgress = {
    version: '2.0.0',
    updatedAt: '2026-08-31T01:00:00.000Z',
    completedSkills: {
      'git-e1.1-ui-client': { completed: true },
      'js-e1.1-types': { completed: true },
    },
  };

  beforeEach(() => {
    localDriver = new MemoryStorageDriver();
    remoteDriver = new MemoryStorageDriver();
  });

  it('reconciles: adopts remote progress when remote is newer', async () => {
    await localDriver.save(olderProgress);
    await remoteDriver.save(newerProgress);

    const syncingDriver = new SyncingStorageDriver({
      local: localDriver,
      remote: remoteDriver,
    });

    const loaded = await syncingDriver.load();
    expect(loaded).toEqual(newerProgress);

    // Local cache should now be updated with remote data
    const localCached = await localDriver.load();
    expect(localCached).toEqual(newerProgress);
  });

  it('reconciles: pushes local progress to remote when local is newer', async () => {
    await localDriver.save(newerProgress);
    await remoteDriver.save(olderProgress);

    const syncingDriver = new SyncingStorageDriver({
      local: localDriver,
      remote: remoteDriver,
    });

    const loaded = await syncingDriver.load();
    expect(loaded).toEqual(newerProgress);

    // Remote should now be updated with local data
    const remoteData = await remoteDriver.load();
    expect(remoteData).toEqual(newerProgress);
  });

  it('falls back to local progress if remote returns null', async () => {
    await localDriver.save(olderProgress);

    const syncingDriver = new SyncingStorageDriver({
      local: localDriver,
      remote: remoteDriver,
    });

    const loaded = await syncingDriver.load();
    expect(loaded).toEqual(olderProgress);
  });

  it('saves immediately to local, and remote failure does not fail save', async () => {
    remoteDriver.setSimulateFailure(true);

    const syncingDriver = new SyncingStorageDriver({
      local: localDriver,
      remote: remoteDriver,
      debounceMs: 10,
    });

    const saveResult = await syncingDriver.save(newerProgress);
    expect(saveResult.ok).toBe(true);

    const localData = await localDriver.load();
    expect(localData).toEqual(newerProgress);

    // Flush debounce
    await syncingDriver.flush(newerProgress);
    expect(syncingDriver.lastRemoteError).toBe('Simulated memory storage failure');
  });

  it('clears both local and remote drivers', async () => {
    await localDriver.save(newerProgress);
    await remoteDriver.save(newerProgress);

    const syncingDriver = new SyncingStorageDriver({
      local: localDriver,
      remote: remoteDriver,
    });

    const clearRes = await syncingDriver.clear();
    expect(clearRes.ok).toBe(true);

    expect(await localDriver.load()).toBeNull();
    expect(await remoteDriver.load()).toBeNull();
  });
});
