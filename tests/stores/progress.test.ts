import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProgressStore } from '../../src/stores/progress';
import { MemoryStorageDriver } from '../../src/services/storage/MemoryStorageDriver';

describe('useProgressStore', () => {
  let memoryDriver: MemoryStorageDriver;

  beforeEach(() => {
    setActivePinia(createPinia());
    memoryDriver = new MemoryStorageDriver();
  });

  it('initializes and loads progress from driver', async () => {
    const store = useProgressStore();
    store.setDriver(memoryDriver);

    await store.loadProgress();
    expect(store.isLoaded).toBe(true);
    expect(store.userProgress.completedSkills).toEqual({});
  });

  it('toggles skill and preserves notes when unchecking (C1)', async () => {
    const store = useProgressStore();
    store.setDriver(memoryDriver);
    await store.loadProgress();

    // 1. Check skill with note
    await store.toggleSkill('git-e1.1-ui-client', 'My important git note');
    expect(store.isSkillCompleted('git-e1.1-ui-client')).toBe(true);
    expect(store.getSkillRecord('git-e1.1-ui-client')?.notes).toBe('My important git note');

    // 2. Uncheck skill -> completed: false, but notes preserved!
    await store.toggleSkill('git-e1.1-ui-client');
    expect(store.isSkillCompleted('git-e1.1-ui-client')).toBe(false);
    expect(store.getSkillRecord('git-e1.1-ui-client')?.notes).toBe('My important git note');

    // 3. Check skill again -> note is still intact!
    await store.toggleSkill('git-e1.1-ui-client');
    expect(store.isSkillCompleted('git-e1.1-ui-client')).toBe(true);
    expect(store.getSkillRecord('git-e1.1-ui-client')?.notes).toBe('My important git note');
  });

  it('updates notes independently without changing completion', async () => {
    const store = useProgressStore();
    store.setDriver(memoryDriver);

    await store.updateSkillNotes('js-e1.1-types', 'Notes on JS primitives');
    expect(store.isSkillCompleted('js-e1.1-types')).toBe(false);
    expect(store.getSkillRecord('js-e1.1-types')?.notes).toBe('Notes on JS primitives');
  });

  it('handles storage failures and sets lastSaveError (C2)', async () => {
    const store = useProgressStore();
    memoryDriver.setSimulateFailure(true);
    store.setDriver(memoryDriver);

    await store.toggleSkill('git-e1.1-ui-client');
    expect(store.lastSaveError).toBe('Simulated memory storage failure');
  });

  it('resets progress cleanly', async () => {
    const store = useProgressStore();
    store.setDriver(memoryDriver);

    await store.toggleSkill('git-e1.1-ui-client');
    expect(Object.keys(store.userProgress.completedSkills).length).toBe(1);

    await store.resetProgress();
    expect(Object.keys(store.userProgress.completedSkills).length).toBe(0);
  });
});
