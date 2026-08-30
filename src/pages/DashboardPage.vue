<script setup lang="ts">
import { computed, ref } from 'vue';
import { AccordionRoot } from 'reka-ui';
import { useFilterStore } from '../stores/filter';
import { useMatrixStore } from '../stores/matrix';
import type { SkillItem } from '../types/matrix';
import ProgressSummary from '../components/progress/ProgressSummary.vue';
import FilterPanel from '../components/matrix/FilterPanel.vue';
import CompetencySection from '../components/matrix/CompetencySection.vue';
import AppDialog from '../components/common/AppDialog.vue';
import { SlidersHorizontal } from 'lucide-vue-next';

interface CompetencyGroup {
  id: string;
  name: string;
  section: string;
  skills: SkillItem[];
}

const filterStore = useFilterStore();
const matrixStore = useMatrixStore();

const filtersDialogOpen = ref(false);
const totalSkills = computed(() => matrixStore.skills.length);

const groupedCompetencies = computed<CompetencyGroup[]>(() => {
  const map = new Map<string, CompetencyGroup>();

  for (const skill of filterStore.filteredSkills) {
    let group = map.get(skill.competencyId);
    if (!group) {
      group = { id: skill.competencyId, name: skill.competencyName, section: skill.section, skills: [] };
      map.set(skill.competencyId, group);
    }
    group.skills.push(skill);
  }

  return Array.from(map.values());
});

const totalShown = computed(() => filterStore.filteredSkills.length);

// While filtering, every matching group opens so results are never hidden
// behind a collapsed header; otherwise the user's own open/closed set wins.
const accordionValue = computed<string[]>({
  get: () =>
    filterStore.hasActiveFilters
      ? groupedCompetencies.value.map((g) => g.id)
      : filterStore.expandedCompetencies,
  set: (value) => {
    if (!filterStore.hasActiveFilters) filterStore.setExpandedCompetencies(value);
  },
});
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
    <!-- ─── Left rail: summary + filters (sticky on desktop) ─── -->
    <aside class="space-y-4 lg:sticky lg:top-20">
      <ProgressSummary />

      <div class="hidden lg:block rounded-2xl bg-(--surface-1) p-5">
        <FilterPanel />
      </div>
    </aside>

    <!-- ─── Right column: the matrix ─── -->
    <section class="space-y-3 min-w-0">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] font-mono text-(--text-tertiary) tabular-nums">
          {{ totalShown }} из {{ totalSkills }} навыков
        </span>

        <!-- Mobile: filters live in a sheet -->
        <button
          type="button"
          class="lg:hidden inline-flex items-center gap-2 min-h-9 px-3 rounded-lg bg-(--surface-1)
                 text-xs text-(--text-secondary) cursor-pointer transition-colors hover:bg-(--surface-2)
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          @click="filtersDialogOpen = true"
        >
          <SlidersHorizontal class="w-3.5 h-3.5" />
          <span>Фильтры</span>
          <span
            v-if="filterStore.activeFilterCount > 0"
            class="min-w-5 px-1 py-0.5 rounded-md bg-(--accent) text-white text-[10px] font-mono leading-none
                   inline-flex items-center justify-center"
          >
            {{ filterStore.activeFilterCount }}
          </span>
        </button>
      </div>

      <AccordionRoot
        v-if="groupedCompetencies.length > 0"
        v-model="accordionValue"
        type="multiple"
        class="space-y-2"
      >
        <CompetencySection
          v-for="group in groupedCompetencies"
          :key="group.id"
          :id="group.id"
          :name="group.name"
          :section="group.section"
          :skills="group.skills"
        />
      </AccordionRoot>

      <div v-else class="rounded-2xl bg-(--surface-1) p-10 text-center space-y-2">
        <p class="text-xs font-medium text-(--text-secondary)">Ничего не найдено</p>
        <button
          type="button"
          class="text-[11px] text-(--accent) cursor-pointer hover:underline rounded
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          @click="filterStore.resetFilters"
        >
          Сбросить фильтры
        </button>
      </div>
    </section>

    <AppDialog v-model:open="filtersDialogOpen" title="Фильтры">
      <FilterPanel />
    </AppDialog>
  </div>
</template>
