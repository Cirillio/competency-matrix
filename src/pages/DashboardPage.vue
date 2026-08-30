<script setup lang="ts">
import { computed } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useFilterStore } from '../stores/filter';
import GradeHero from '../components/progress/GradeHero.vue';
import GapBlockers from '../components/progress/GapBlockers.vue';
import BonusSection from '../components/progress/BonusSection.vue';
import FilterBar from '../components/matrix/FilterBar.vue';
import CompetencySection from '../components/matrix/CompetencySection.vue';

const progressStore = useProgressStore();
const filterStore = useFilterStore();

const currentGrade = computed(() => progressStore.evaluation.currentGrade);
const targetGrade = computed(() => progressStore.evaluation.targetGrade);

// Group filtered skills by competency
const groupedCompetencies = computed(() => {
  const map = new Map<string, {
    id: string;
    name: string;
    category: string;
    section: string;
    skills: typeof filterStore.filteredSkills;
    defaultExpanded: boolean;
  }>();

  for (const skill of filterStore.filteredSkills) {
    if (!map.has(skill.competencyId)) {
      map.set(skill.competencyId, {
        id: skill.competencyId,
        name: skill.competencyName,
        category: skill.category,
        section: skill.section,
        skills: [],
        defaultExpanded: false,
      });
    }
    const group = map.get(skill.competencyId)!;
    group.skills.push(skill);

    // Expand by default if competency contains skills of current or target grade
    if (skill.grade === currentGrade.value || skill.grade === targetGrade.value) {
      group.defaultExpanded = true;
    }
  }

  // If user searched or filtered, expand matching groups
  if (filterStore.searchQuery || filterStore.onlyGap || filterStore.onlyUncompleted) {
    for (const group of map.values()) {
      group.defaultExpanded = true;
    }
  }

  return Array.from(map.values());
});
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- 1. Grade Hero Block -->
    <GradeHero />

    <!-- 2. Gap Blockers (Quiet List) -->
    <GapBlockers />

    <!-- 3. Bonus Specializations (Only shown if completedBonusSkills > 0) -->
    <BonusSection />

    <!-- 4. Filter Bar -->
    <FilterBar />

    <!-- 5. Collapsible Matrix Competencies List -->
    <div v-if="groupedCompetencies.length > 0" class="space-y-3">
      <CompetencySection
        v-for="group in groupedCompetencies"
        :key="group.id"
        :id="group.id"
        :name="group.name"
        :category="group.category"
        :section="group.section"
        :skills="group.skills"
        :default-expanded="group.defaultExpanded"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-(--surface-1) rounded-xl p-10 text-center space-y-2 text-xs"
    >
      <div class="text-(--text-secondary) font-medium">Ничего не найдено</div>
      <p class="text-(--text-tertiary) max-w-xs mx-auto">
        По выбранным фильтрам навыки отсутствуют. Попробуйте сбросить фильтры.
      </p>
    </div>
  </div>
</template>
