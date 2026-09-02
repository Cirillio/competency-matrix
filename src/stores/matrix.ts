import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SkillItem } from '../types/matrix';
import { matrixDataSchema } from '../types/matrix';
import matrixRawData from '../data/matrix.json';
import { usePacksStore } from './packs';

export interface CompetencyGroup {
  id: string;
  name: string;
  category: string;
  section: string;
  skills: SkillItem[];
}

function loadAndValidateMatrix(): SkillItem[] {
  const result = matrixDataSchema.safeParse(matrixRawData);
  if (!result.success) {
    console.error('Matrix dataset validation failed:', result.error);
    if (import.meta.env.DEV) {
      throw new Error(`Matrix validation error: ${result.error.message}`);
    }
    return (matrixRawData.skills as unknown as SkillItem[]) || [];
  }
  return result.data.skills;
}

export const useMatrixStore = defineStore('matrix', () => {
  const builtInSkills = ref<SkillItem[]>(loadAndValidateMatrix());
  const packsStore = usePacksStore();

  // The working set = curated dataset + every enabled imported pack.
  const skills = computed<SkillItem[]>(() => [
    ...builtInSkills.value,
    ...packsStore.enabledSkills,
  ]);

  /** Choices for the "источник" filter: everything, the built-in set, or one enabled pack. */
  const sources = computed(() => [
    { id: 'all', name: 'Все матрицы' },
    { id: 'builtin', name: 'Встроенная' },
    ...packsStore.packs.filter((p) => p.enabled).map((p) => ({ id: p.id, name: p.name })),
  ]);

  /** skill id -> 'builtin' | <packId> */
  const skillSource = computed<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const s of builtInSkills.value) m.set(s.id, 'builtin');
    for (const pack of packsStore.packs) {
      if (!pack.enabled) continue;
      for (const s of pack.skills) m.set(s.id, pack.id);
    }
    return m;
  });

  const categories = computed(() => {
    return Array.from(new Set(skills.value.map((s) => s.category)));
  });

  const sections = computed(() => {
    return Array.from(new Set(skills.value.map((s) => s.section)));
  });

  const competencies = computed<CompetencyGroup[]>(() => {
    const map = new Map<string, CompetencyGroup>();

    for (const skill of skills.value) {
      if (!map.has(skill.competencyId)) {
        map.set(skill.competencyId, {
          id: skill.competencyId,
          name: skill.competencyName,
          category: skill.category,
          section: skill.section,
          skills: [],
        });
      }
      map.get(skill.competencyId)!.skills.push(skill);
    }

    return Array.from(map.values());
  });

  return {
    /** Curated dataset + enabled imported packs. Used by the tracker. */
    skills,
    /** The bundled, curated dataset only. Used by the public catalogue. */
    builtInSkills,
    sources,
    skillSource,
    categories,
    sections,
    competencies,
  };
});
