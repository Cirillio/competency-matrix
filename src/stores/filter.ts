import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Grade, RequirementLevel, SkillItem } from '../types/matrix';
import { useMatrixStore } from './matrix';
import { useProgressStore } from './progress';

export const useFilterStore = defineStore('filter', () => {
  const matrixStore = useMatrixStore();
  const progressStore = useProgressStore();

  const searchQuery = ref('');
  const selectedGrade = ref<Grade | 'all'>('all');
  const selectedCategory = ref<string | 'all'>('all');
  const selectedSection = ref<string | 'all'>('all');
  const selectedRequirement = ref<RequirementLevel | 'all'>('all');
  const onlyUncompleted = ref(false);
  const onlyGap = ref(false);

  const availableSections = computed(() => {
    const list = selectedCategory.value === 'all'
      ? matrixStore.skills
      : matrixStore.skills.filter((s) => s.category === selectedCategory.value);
    return Array.from(new Set(list.map((s) => s.section)));
  });

  const filteredSkills = computed<SkillItem[]>(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return matrixStore.skills.filter((skill) => {
      // 1. Grade filter
      if (selectedGrade.value !== 'all' && skill.grade !== selectedGrade.value) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory.value !== 'all' && skill.category !== selectedCategory.value) {
        return false;
      }

      // 3. Section filter
      if (selectedSection.value !== 'all' && skill.section !== selectedSection.value) {
        return false;
      }

      // 4. Requirement filter
      if (selectedRequirement.value !== 'all' && skill.requirement !== selectedRequirement.value) {
        return false;
      }

      // 5. Only uncompleted
      if (onlyUncompleted.value && progressStore.isSkillCompleted(skill.id)) {
        return false;
      }

      // 6. Only GAP skills
      if (onlyGap.value && !progressStore.gapSkillIds.has(skill.id)) {
        return false;
      }

      // 7. Search query
      if (query) {
        const inTitle = skill.title.toLowerCase().includes(query);
        const inDesc = skill.description.toLowerCase().includes(query);
        const inComp = skill.competencyName.toLowerCase().includes(query);
        const inTopics = skill.topics.some((t) => t.toLowerCase().includes(query));
        if (!inTitle && !inDesc && !inComp && !inTopics) {
          return false;
        }
      }

      return true;
    });
  });

  function resetFilters() {
    searchQuery.value = '';
    selectedGrade.value = 'all';
    selectedCategory.value = 'all';
    selectedSection.value = 'all';
    selectedRequirement.value = 'all';
    onlyUncompleted.value = false;
    onlyGap.value = false;
  }

  return {
    searchQuery,
    selectedGrade,
    selectedCategory,
    selectedSection,
    selectedRequirement,
    onlyUncompleted,
    onlyGap,
    availableSections,
    filteredSkills,
    resetFilters,
  };
});
