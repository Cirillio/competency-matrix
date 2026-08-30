import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserProgress, SkillProgressRecord } from '../types/progress';
import { PROGRESS_SCHEMA_VERSION } from '../types/progress';
import type { Grade } from '../types/matrix';
import type { EvaluationResult } from '../types/evaluation';
import { evaluateProgress } from '../utils/gradeEvaluator';
import { useMatrixStore } from './matrix';
import type { IStorageDriver } from '../services/storage/IStorageDriver';
import { createStorageDriver } from '../services/storage';

export const useProgressStore = defineStore('progress', () => {
  const matrixStore = useMatrixStore();
  let driver: IStorageDriver = createStorageDriver();

  const isLoaded = ref(false);
  const lastSaveError = ref<string | null>(null);
  const userProgress = ref<UserProgress>({
    version: PROGRESS_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    manualTargetGrade: null,
    completedSkills: {},
  });

  function setDriver(newDriver: IStorageDriver) {
    driver = newDriver;
  }

  async function loadProgress() {
    const saved = await driver.load();
    if (saved) {
      userProgress.value = saved;
    }
    isLoaded.value = true;
  }

  async function saveProgress(): Promise<boolean> {
    userProgress.value.updatedAt = new Date().toISOString();
    const result = await driver.save(userProgress.value);
    if (!result.ok) {
      lastSaveError.value = result.error;
      return false;
    }
    lastSaveError.value = null;
    return true;
  }

  async function toggleSkill(skillId: string, notes?: string) {
    const current = userProgress.value.completedSkills[skillId];

    if (current && current.completed) {
      // Uncheck: keep completed: false, PRESERVE notes!
      userProgress.value.completedSkills[skillId] = {
        ...current,
        completed: false,
        completedAt: undefined,
      };
    } else {
      // Check: mark completed
      userProgress.value.completedSkills[skillId] = {
        completed: true,
        completedAt: new Date().toISOString(),
        notes: notes !== undefined ? notes : current?.notes,
      };
    }
    await saveProgress();
  }

  async function updateSkillNotes(skillId: string, notes: string) {
    const current = userProgress.value.completedSkills[skillId];
    if (current) {
      current.notes = notes;
    } else {
      userProgress.value.completedSkills[skillId] = {
        completed: false,
        notes,
      };
    }
    await saveProgress();
  }

  async function setProfile(profile: string) {
    userProgress.value.profile = profile;
    await saveProgress();
  }

  async function setTargetGrade(grade: Grade | null) {
    userProgress.value.manualTargetGrade = grade;
    await saveProgress();
  }

  function resetLocalState() {
    userProgress.value = {
      version: PROGRESS_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      manualTargetGrade: null,
      completedSkills: {},
    };
  }

  async function resetProgress() {
    resetLocalState();
    const result = await driver.clear();
    if (!result.ok) {
      lastSaveError.value = result.error;
    }
  }

  async function importProgress(imported: UserProgress) {
    userProgress.value = imported;
    await saveProgress();
  }

  const isSkillCompleted = computed(() => {
    return (skillId: string): boolean => {
      const record = userProgress.value.completedSkills[skillId];
      return Boolean(record && record.completed);
    };
  });

  const getSkillRecord = computed(() => {
    return (skillId: string): SkillProgressRecord | undefined => {
      return userProgress.value.completedSkills[skillId];
    };
  });

  const evaluation = computed<EvaluationResult>(() => {
    return evaluateProgress(
      matrixStore.skills,
      userProgress.value.completedSkills,
      userProgress.value.manualTargetGrade ?? null
    );
  });

  const gapSkillIds = computed<Set<string>>(() => {
    return new Set(evaluation.value.gapSkills.map((s) => s.id));
  });

  return {
    isLoaded,
    lastSaveError,
    userProgress,
    setDriver,
    loadProgress,
    toggleSkill,
    updateSkillNotes,
    setProfile,
    setTargetGrade,
    resetLocalState,
    resetProgress,
    importProgress,
    isSkillCompleted,
    getSkillRecord,
    evaluation,
    gapSkillIds,
  };
});
