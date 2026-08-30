<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from 'vue';
import { useFilterStore } from '../../stores/filter';
import { useMatrixStore } from '../../stores/matrix';
import { ORDERED_GRADES, type Grade, type RequirementLevel } from '../../types/matrix';
import { Search, X, RotateCcw } from 'lucide-vue-next';

const filterStore = useFilterStore();
const matrixStore = useMatrixStore();

// Vue 3.5 useTemplateRef
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef');

function handleKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const gradesList: (Grade | 'all')[] = ['all', ...ORDERED_GRADES];

const requirements: { value: RequirementLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Все важности' },
  { value: 'mandatory', label: 'Обязательно' },
  { value: 'desirable', label: 'Желательно' },
  { value: 'additional', label: 'Дополнительно' },
  { value: 'optional', label: 'Опционально' },
];
</script>

<template>
  <div class="bg-[var(--surface-1)] rounded-xl p-4 space-y-3">
    <!-- Top Row: Search & Toggles -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative w-full sm:w-80">
        <Search class="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="matrix-search-input"
          ref="searchInputRef"
          v-model="filterStore.searchQuery"
          type="text"
          placeholder="Поиск по навыкам..."
          class="w-full bg-[var(--surface-2)] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          v-if="filterStore.searchQuery"
          @click="filterStore.searchQuery = ''"
          aria-label="Очистить поиск"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <!-- Quick Toggles -->
      <div class="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
        <button
          type="button"
          @click="filterStore.onlyGap = !filterStore.onlyGap"
          :class="[
            'px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium select-none',
            filterStore.onlyGap
              ? 'bg-[var(--critical-subtle)] text-[var(--critical)]'
              : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          ]"
        >
          Блокеры
        </button>

        <button
          type="button"
          @click="filterStore.onlyUncompleted = !filterStore.onlyUncompleted"
          :class="[
            'px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium select-none',
            filterStore.onlyUncompleted
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
              : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          ]"
        >
          Только незакрытые
        </button>

        <button
          type="button"
          @click="filterStore.resetFilters"
          title="Сбросить фильтры"
          aria-label="Сбросить фильтры"
          class="p-1.5 rounded-md bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Grade Filter Horizontal Pills -->
    <div class="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono">
      <button
        v-for="g in gradesList"
        :key="g"
        type="button"
        @click="filterStore.selectedGrade = g"
        :class="[
          'px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 select-none',
          filterStore.selectedGrade === g
            ? 'bg-[var(--text-primary)] text-[var(--surface-0)] font-semibold'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
        ]"
      >
        {{ g === 'all' ? 'Все' : g }}
      </button>
    </div>

    <!-- Dropdowns with accessible labels (C5) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--surface-2)] text-xs">
      <div class="space-y-1">
        <label for="category-filter-select" class="block text-[10px] font-mono text-[var(--text-tertiary)]">Категория</label>
        <select
          id="category-filter-select"
          v-model="filterStore.selectedCategory"
          class="w-full bg-[var(--surface-2)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">Все категории</option>
          <option v-for="cat in matrixStore.categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="section-filter-select" class="block text-[10px] font-mono text-[var(--text-tertiary)]">Секция</label>
        <select
          id="section-filter-select"
          v-model="filterStore.selectedSection"
          class="w-full bg-[var(--surface-2)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">Все секции</option>
          <option v-for="sec in filterStore.availableSections" :key="sec" :value="sec">
            {{ sec }}
          </option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="requirement-filter-select" class="block text-[10px] font-mono text-[var(--text-tertiary)]">Важность</label>
        <select
          id="requirement-filter-select"
          v-model="filterStore.selectedRequirement"
          class="w-full bg-[var(--surface-2)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option v-for="req in requirements" :key="req.value" :value="req.value">
            {{ req.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
