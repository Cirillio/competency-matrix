<script setup lang="ts">
import { computed } from 'vue';
import { useProgressStore } from '../../stores/progress';
import ProgressBar from '../common/ProgressBar.vue';

const progressStore = useProgressStore();

// Show ONLY if at least one bonus skill is completed
const activeSpecializations = computed(() => {
  const specs = Object.values(progressStore.evaluation.bonusSpecializations);
  return specs.filter((s) => s.completedBonusSkills > 0);
});
</script>

<template>
  <section
    v-if="activeSpecializations.length > 0"
    class="bg-[var(--surface-1)] rounded-xl p-5 space-y-4"
  >
    <div class="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
      Специализации и бонусные навыки
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="spec in activeSpecializations"
        :key="spec.competencyId"
        class="bg-[var(--surface-2)] rounded-lg p-3 space-y-2"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--text-primary)] truncate">{{ spec.competencyName }}</span>
          <span class="font-mono text-[11px] text-[var(--text-secondary)]">
            {{ spec.completedBonusSkills }}/{{ spec.totalBonusSkills }}
          </span>
        </div>
        <ProgressBar :value="spec.percent" color="accent" size="sm" />
      </div>
    </div>
  </section>
</template>
