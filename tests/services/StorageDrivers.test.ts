// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageDriver } from '../../src/services/storage/LocalStorageDriver';
import { MemoryStorageDriver } from '../../src/services/storage/MemoryStorageDriver';
import type { UserProgress } from '../../src/types/progress';

describe('Storage Drivers', () => {
  const sampleProgress: UserProgress = {
    version: '2.0.0',
    updatedAt: '2026-08-31T00:00:00Z',
    completedSkills: {
      'git-e1.1-ui-client': { completed: true, completedAt: '2026-08-31T00:00:00Z' },
    },
  };

  describe('MemoryStorageDriver', () => {
    it('loads null when empty', async () => {
      const driver = new MemoryStorageDriver();
      expect(await driver.load()).toBeNull();
    });

    it('saves and loads round-trip', async () => {
      const driver = new MemoryStorageDriver();
      const saveRes = await driver.save(sampleProgress);
      expect(saveRes.ok).toBe(true);

      const loaded = await driver.load();
      expect(loaded).toEqual(sampleProgress);
    });

    it('clears storage cleanly', async () => {
      const driver = new MemoryStorageDriver(sampleProgress);
      expect(await driver.load()).not.toBeNull();

      const clearRes = await driver.clear();
      expect(clearRes.ok).toBe(true);
      expect(await driver.load()).toBeNull();
    });

    it('handles simulated failures', async () => {
      const driver = new MemoryStorageDriver();
      driver.setSimulateFailure(true);

      const saveRes = await driver.save(sampleProgress);
      expect(saveRes.ok).toBe(false);
      expect(await driver.load()).toBeNull();
    });
  });

  describe('LocalStorageDriver', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads null when empty', async () => {
      const driver = new LocalStorageDriver('test_key');
      expect(await driver.load()).toBeNull();
    });

    it('returns null on schema corrupted data', async () => {
      localStorage.setItem('test_corrupted_key', JSON.stringify({ notAValidProgress: true }));
      const driver = new LocalStorageDriver('test_corrupted_key');
      expect(await driver.load()).toBeNull();
    });

    it('saves and loads valid data', async () => {
      const driver = new LocalStorageDriver('test_key');
      const res = await driver.save(sampleProgress);
      expect(res.ok).toBe(true);

      const loaded = await driver.load();
      expect(loaded?.completedSkills['git-e1.1-ui-client']).toBeDefined();
    });

    it('transparently migrates legacy cdek_matrix_progress_v2 key on load', async () => {
      localStorage.setItem('cdek_matrix_progress_v2', JSON.stringify(sampleProgress));

      const driver = new LocalStorageDriver(); // uses default 'matrix_progress_v2'
      const loaded = await driver.load();

      expect(loaded).toEqual(sampleProgress);
      expect(localStorage.getItem('matrix_progress_v2')).not.toBeNull();
      expect(localStorage.getItem('cdek_matrix_progress_v2')).toBeNull();
    });
  });
});
