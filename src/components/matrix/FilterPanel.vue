<script setup lang="ts">
import { computed, useTemplateRef, onMounted, onUnmounted } from 'vue';
import { useFilterStore } from '../../stores/filter';
import { useMatrixStore } from '../../stores/matrix';
import { ORDERED_GRADES, type Grade, type RequirementLevel } from '../../types/matrix';
import AppSelect, { type SelectOption } from '../common/AppSelect.vue';
import { PhMagnifyingGlass, PhX, PhArrowCounterClockwise } from '@phosphor-icons/vue';

const filterStore = useFilterStore();
const matrixStore = useMatrixStore();

const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef');

function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  const typingElsewhere = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
  if (e.key === '/' && !typingElsewhere) {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

const gradesList: (Grade | 'all')[] = ['all', ...ORDERED_GRADES];

/** Grades below the selected one are swept in by the cumulative filter. */
function isIncluded(g: Grade | 'all'): boolean {
  const selected = filterStore.selectedGrade;
  if (g === 'all' || selected === 'all') return false;
  return ORDERED_GRADES.indexOf(g) < ORDERED_GRADES.indexOf(selected);
}

const categoryOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Все категории' },
  ...matrixStore.categories.map((c) => ({ value: c, label: c })),
]);

const sectionOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Все секции' },
  ...filterStore.availableSections.map((s) => ({ value: s, label: s })),
]);

const requirementOptions: SelectOption[] = [
  { value: 'all', label: 'Любая важность' },
  { value: 'mandatory', label: 'Обязательно' },
  { value: 'desirable', label: 'Желательно' },
  { value: 'additional', label: 'Дополнительно' },
  { value: 'optional', label: 'Опционально' },
];

// Bridge the store's union types to the string-only Select model.
const category = computed({
  get: () => filterStore.selectedCategory,
  set: (v: string) => { filterStore.selectedCategory = v; },
});
const section = computed({
  get: () => filterStore.selectedSection,
  set: (v: string) => { filterStore.selectedSection = v; },
});
const requirement = computed({
  get: () => filterStore.selectedRequirement,
  set: (v: string) => { filterStore.selectedRequirement = v as RequirementLevel | 'all'; },
});
</script>

<template>
  <div class="space-y-4">
    <!-- Search -->
    <div class="relative">
      <PhMagnifyingGlass :size="16" class="text-(--text-tertiary) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        ref="searchInputRef"
        v-model="filterStore.searchQuery"
        type="text"
        aria-label="Поиск по навыкам"
        placeholder="Поиск"
        class="w-full min-h-11 sm:min-h-9 rounded-lg bg-(--surface-2) pl-9 pr-9 text-xs
               text-(--text-primary) placeholder-(--text-tertiary)
               focus:outline-none focus:ring-2 focus:ring-(--accent)"
      >
      <button
        v-if="filterStore.searchQuery"
        type="button"
        aria-label="Очистить поиск"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer
               text-(--text-tertiary) hover:text-(--text-primary) transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        @click="filterStore.searchQuery = ''"
      >
        <PhX :size="14" />
      </button>
    </div>

    <!-- Quick toggles -->
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        :aria-pressed="filterStore.onlyGap"
        :class="[
          'min-h-9 px-2.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
          filterStore.onlyGap
            ? 'bg-(--critical-subtle) text-(--critical)'
            : 'bg-(--surface-2) text-(--text-secondary) hover:text-(--text-primary)',
        ]"
        @click="filterStore.onlyGap = !filterStore.onlyGap"
      >
        Блокеры
      </button>

      <button
        type="button"
        :aria-pressed="filterStore.onlyUncompleted"
        :class="[
          'min-h-9 px-2.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
          filterStore.onlyUncompleted
            ? 'bg-(--accent-subtle) text-(--accent)'
            : 'bg-(--surface-2) text-(--text-secondary) hover:text-(--text-primary)',
        ]"
        @click="filterStore.onlyUncompleted = !filterStore.onlyUncompleted"
      >
        Незакрытые
      </button>

      <button
        v-if="filterStore.hasActiveFilters"
        type="button"
        aria-label="Сбросить фильтры"
        class="min-h-9 px-2 rounded-lg bg-(--surface-2) text-(--text-tertiary) cursor-pointer
               hover:text-(--text-primary) transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        @click="filterStore.resetFilters"
      >
        <PhArrowCounterClockwise :size="16" />
      </button>
    </div>

    <!-- Grade pills -->
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">Грейд</span>
        <span v-if="filterStore.selectedGrade !== 'all'" class="text-[10px] text-(--text-tertiary)">
          включая нижние
        </span>
      </div>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="g in gradesList"
          :key="g"
          type="button"
          :class="[
            'min-h-8 px-2 rounded-md text-[11px] font-mono cursor-pointer transition-colors select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
            filterStore.selectedGrade === g
              ? 'bg-(--text-primary) text-(--surface-0) font-semibold'
              : isIncluded(g)
                ? 'bg-(--surface-3) text-(--text-secondary)'
                : 'bg-(--surface-2) text-(--text-tertiary) hover:text-(--text-secondary)',
          ]"
          @click="filterStore.selectedGrade = g"
        >
          {{ g === 'all' ? 'Все' : g }}
        </button>
      </div>
    </div>

    <div class="space-y-2.5">
      <AppSelect v-model="category" label="Категория" :options="categoryOptions" />
      <AppSelect v-model="section" label="Секция" :options="sectionOptions" />
      <AppSelect v-model="requirement" label="Важность" :options="requirementOptions" />
    </div>
  </div>
</template>
