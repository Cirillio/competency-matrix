<script setup lang="ts">
import { computed } from 'vue';
import { useProgressStore } from '../../stores/progress';
import { useFilterStore } from '../../stores/filter';

const progressStore = useProgressStore();
const filterStore = useFilterStore();

const gapSkills = computed(() => progressStore.evaluation.gapSkills);

function filterByGap() {
  filterStore.onlyGap = true;
  filterStore.onlyUncompleted = true;
}
</script>

<template>
  <section
    v-if="gapSkills.length > 0"
    class="bg-[var(--surface-1)] rounded-xl p-5 space-y-3"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
        <span class="w-2 h-2 rounded-full bg-[var(--critical)]" />
        <span>Блокеры перехода к {{ progressStore.evaluation.targetGrade }}</span>
        <span class="px-1.5 py-0.2 rounded font-mono text-[11px] text-[var(--critical)] bg-[var(--critical-subtle)] font-bold">
          {{ gapSkills.length }}
        </span>
      </div>

      <button
        @click="filterByGap"
        class="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
      >
        Показать в матрице →
      </button>
    </div>

    <!-- Quiet Inline List -->
    <div class="divide-y divide-[var(--surface-2)] text-xs">
      <div
        v-for="skill in gapSkills.slice(0, 5)"
        :key="skill.id"
        class="py-2 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2 truncate">
          <span class="font-mono text-[11px] text-[var(--text-tertiary)] shrink-0">{{ skill.grade }}</span>
          <span class="text-[var(--text-secondary)] truncate">
            <strong class="text-[var(--text-primary)] font-medium">{{ skill.title }}</strong>
            <span class="text-[var(--text-tertiary)] ml-1.5">({{ skill.competencyName }})</span>
          </span>
        </div>
        <span class="text-[10px] font-mono text-[var(--critical)] shrink-0">Обязательно</span>
      </div>
    </div>
  </section>
</template>
