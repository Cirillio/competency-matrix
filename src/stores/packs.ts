import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SkillItem } from '../types/matrix';
import {
  collectEnabledPackSkills,
  validatePack,
  type StoredPack,
  type PackValidationResult,
} from '../types/matrixPack';
import { PacksService } from '../services/packs/PacksService';

export interface ImportOutcome {
  ok: boolean;
  problems?: string[];
  packName?: string;
}

/**
 * Owns the user's imported competency packs. Does NOT import the matrix store —
 * built-in skill ids are passed in by the caller to keep the dependency
 * one-directional (matrix store reads `enabledSkills` from here).
 */
export const usePacksStore = defineStore('packs', () => {
  const packs = ref<StoredPack[]>([]);
  const isLoaded = ref(false);

  const enabledSkills = computed<SkillItem[]>(() => collectEnabledPackSkills(packs.value));

  async function load() {
    packs.value = await PacksService.list();
    isLoaded.value = true;
  }

  function reset() {
    packs.value = [];
    isLoaded.value = false;
    PacksService.clearCache();
  }

  function knownSkillIds(builtInSkillIds: ReadonlySet<string>): Set<string> {
    const ids = new Set(builtInSkillIds);
    for (const pack of packs.value) {
      for (const skill of pack.skills) ids.add(skill.id);
    }
    return ids;
  }

  function validate(raw: unknown, builtInSkillIds: ReadonlySet<string>): PackValidationResult {
    return validatePack(raw, knownSkillIds(builtInSkillIds));
  }

  async function importPack(
    raw: unknown,
    builtInSkillIds: ReadonlySet<string>
  ): Promise<ImportOutcome> {
    const result = validate(raw, builtInSkillIds);
    if (!result.ok) return { ok: false, problems: result.problems };

    try {
      const created = await PacksService.create(result.pack);
      if (!created) return { ok: false, problems: ['Нужно войти в аккаунт, чтобы сохранить набор'] };
      packs.value = [...packs.value, created];
      return { ok: true, packName: created.name };
    } catch (err) {
      return { ok: false, problems: [err instanceof Error ? err.message : 'Ошибка сохранения'] };
    }
  }

  async function toggle(id: string) {
    const pack = packs.value.find((p) => p.id === id);
    if (!pack) return;
    const next = !pack.enabled;
    pack.enabled = next; // optimistic
    try {
      await PacksService.setEnabled(id, next);
    } catch {
      pack.enabled = !next; // revert
    }
  }

  async function remove(id: string) {
    const snapshot = packs.value;
    packs.value = packs.value.filter((p) => p.id !== id);
    try {
      await PacksService.remove(id);
    } catch {
      packs.value = snapshot;
    }
  }

  return {
    packs,
    isLoaded,
    enabledSkills,
    load,
    reset,
    validate,
    importPack,
    toggle,
    remove,
  };
});
