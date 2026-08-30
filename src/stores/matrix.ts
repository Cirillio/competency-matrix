import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SkillItem } from '../types/matrix';
import { matrixDataSchema } from '../types/matrix';
import matrixRawData from '../data/matrix.json';

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
  const skills = ref<SkillItem[]>(loadAndValidateMatrix());

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
    skills,
    categories,
    sections,
    competencies,
  };
});
