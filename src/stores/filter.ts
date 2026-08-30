import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ORDERED_GRADES, type Grade, type RequirementLevel, type SkillItem } from '../types/matrix';
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

  // Which competency accordion items are open. Lives here (not in the component)
  // so the open/closed state survives re-filtering and re-mounting of rows.
  const expandedCompetencies = ref<string[]>([]);

  const hasActiveFilters = computed(() =>
    Boolean(
      searchQuery.value.trim() ||
      selectedGrade.value !== 'all' ||
      selectedCategory.value !== 'all' ||
      selectedSection.value !== 'all' ||
      selectedRequirement.value !== 'all' ||
      onlyUncompleted.value ||
      onlyGap.value
    )
  );

  const activeFilterCount = computed(() => {
    let count = 0;
    if (searchQuery.value.trim()) count++;
    if (selectedGrade.value !== 'all') count++;
    if (selectedCategory.value !== 'all') count++;
    if (selectedSection.value !== 'all') count++;
    if (selectedRequirement.value !== 'all') count++;
    if (onlyUncompleted.value) count++;
    if (onlyGap.value) count++;
    return count;
  });

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
      // Grades are cumulative: reaching E1.2 also requires everything from E1.1,
      // so selecting a grade shows that grade and every grade below it.
      if (selectedGrade.value !== 'all') {
        const maxIndex = ORDERED_GRADES.indexOf(selectedGrade.value);
        if (ORDERED_GRADES.indexOf(skill.grade) > maxIndex) {
          return false;
        }
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

  function setExpandedCompetencies(ids: string[]) {
    expandedCompetencies.value = ids;
  }

  /** Used by the GAP popover: jump straight to the blocking skills in the matrix. */
  function showGapInMatrix() {
    resetFilters();
    onlyGap.value = true;
    onlyUncompleted.value = true;
  }

  return {
    searchQuery,
    selectedGrade,
    selectedCategory,
    selectedSection,
    selectedRequirement,
    onlyUncompleted,
    onlyGap,
    expandedCompetencies,
    hasActiveFilters,
    activeFilterCount,
    availableSections,
    filteredSkills,
    resetFilters,
    setExpandedCompetencies,
    showGapInMatrix,
  };
});
