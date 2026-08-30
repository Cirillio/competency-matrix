<script setup lang="ts">
import { computed } from 'vue';
import { useProgressStore } from '../../stores/progress';
import { ORDERED_GRADES, type Grade } from '../../types/matrix';
import { GRADE_DETAILS, TIERS } from '../../config/grades';
import ProgressBar from '../common/ProgressBar.vue';
import { RadioGroupRoot, RadioGroupItem } from 'reka-ui';
import { RotateCcw } from 'lucide-vue-next';

const progressStore = useProgressStore();
const evalResult = computed(() => progressStore.evaluation);

const currentMeta = computed(() => {
  return GRADE_DETAILS[evalResult.value.currentGrade] || {
    label: evalResult.value.currentGrade,
    shortLabel: '',
    tier: 'Pre',
  };
});

const targetProgress = computed(() => {
  if (!evalResult.value.targetGrade) return null;
  return evalResult.value.gradesProgress[evalResult.value.targetGrade];
});

const currentGradeIndex = computed(() => {
  if (evalResult.value.currentGrade === 'Pre-E1.1') return -1;
  return ORDERED_GRADES.indexOf(evalResult.value.currentGrade as Grade);
});

function isSelectableTarget(grade: Grade): boolean {
  const idx = ORDERED_GRADES.indexOf(grade);
  return idx > currentGradeIndex.value;
}

function handleTargetSelect(val: unknown) {
  if (typeof val !== 'string' || !val) return;
  if (val === evalResult.value.targetGrade && evalResult.value.isTargetManual) {
    progressStore.setTargetGrade(null); // Toggle off if clicked again
  } else {
    progressStore.setTargetGrade(val as Grade);
  }
}

function resetManualTarget() {
  progressStore.setTargetGrade(null);
}

// Intermediate grades between current and target
const intermediateGrades = computed(() => {
  if (!evalResult.value.targetGrade || !evalResult.value.isTargetManual) return [];
  const targetIdx = ORDERED_GRADES.indexOf(evalResult.value.targetGrade);
  if (targetIdx <= currentGradeIndex.value + 1) return [];
  return ORDERED_GRADES.slice(currentGradeIndex.value + 1, targetIdx);
});
</script>

<template>
  <section class="bg-[var(--surface-1)] rounded-2xl p-6 space-y-6">
    <!-- Top Display: Current Grade Status -->
    <div class="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-baseline gap-3">
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {{ currentMeta.label }}
          </h1>
          <span class="text-base font-mono font-medium text-[var(--text-tertiary)]">
            {{ evalResult.currentGrade }}
          </span>
        </div>
        <p class="text-xs text-[var(--text-secondary)]">
          {{ currentMeta.shortLabel }}
        </p>
      </div>

      <!-- Secondary Stats (Matrix Coverage & Blockers) -->
      <div class="flex items-center gap-6 text-xs text-[var(--text-secondary)] font-mono">
        <div>
          Охват матрицы:
          <strong class="text-[var(--text-primary)]">{{ evalResult.matrixProgressPercent }}%</strong>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            v-if="evalResult.gapSkills.length > 0"
            class="w-1.5 h-1.5 rounded-full bg-[var(--critical)]"
          />
          <span>Блокеры:</span>
          <strong :class="evalResult.gapSkills.length > 0 ? 'text-[var(--critical)]' : 'text-[var(--text-primary)]'">
            {{ evalResult.gapSkills.length }}
          </strong>
        </div>
      </div>
    </div>

    <!-- Grade Ladder: Grouped by 5 Tier Blocks -->
    <div class="space-y-3 pt-2">
      <div class="flex items-center justify-between text-xs">
        <span class="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          Лестница грейдов (5 уровней)
        </span>
        <button
          v-if="evalResult.isTargetManual"
          type="button"
          @click="resetManualTarget"
          class="text-[11px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Сбросить цель к {{ evalResult.autoTargetGrade }}</span>
        </button>
      </div>

      <RadioGroupRoot
        :model-value="evalResult.targetGrade ?? ''"
        @update:model-value="handleTargetSelect"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        aria-label="Выбор целевого грейда"
      >
        <!-- Tier Block -->
        <div
          v-for="tier in TIERS"
          :key="tier.name"
          class="bg-[var(--surface-2)]/50 rounded-xl p-2.5 space-y-2 flex flex-col justify-between"
        >
          <!-- Tier Header -->
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-1">
            {{ tier.name }}
          </div>

          <!-- Tier Grade Steps (2 steps per tier) -->
          <div class="grid grid-cols-2 gap-1.5">
            <RadioGroupItem
              v-for="grade in tier.grades"
              :key="grade"
              :value="grade"
              :disabled="!isSelectableTarget(grade)"
              :title="`${grade} (${GRADE_DETAILS[grade].label}): ${
                evalResult.certifiedGrades.includes(grade)
                  ? 'Сдан'
                  : evalResult.gradesProgress[grade]?.isCertified
                  ? 'Закрыт вне цепочки'
                  : grade === evalResult.targetGrade
                  ? 'Выбранная цель'
                  : 'Впереди'
              }`"
              :class="[
                'p-2 rounded-lg flex flex-col justify-between transition-all duration-150 select-none text-left cursor-pointer border-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                grade === evalResult.targetGrade
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : evalResult.certifiedGrades.includes(grade)
                  ? 'bg-[var(--success-subtle)] text-[var(--success)]'
                  : evalResult.gradesProgress[grade]?.isCertified
                  ? 'bg-[var(--success-subtle)]/50 text-[var(--text-secondary)]'
                  : isSelectableTarget(grade)
                  ? 'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  : 'bg-[var(--surface-2)]/60 text-[var(--text-tertiary)] opacity-60 cursor-default'
              ]"
            >
              <div class="text-xs font-bold font-mono">
                {{ grade }}
              </div>

              <!-- Mandatory Progress Count -->
              <div class="mt-2 text-[10px] font-mono opacity-90">
                {{ evalResult.gradesProgress[grade]?.completedMandatory }}/{{ evalResult.gradesProgress[grade]?.totalMandatory }}
              </div>
            </RadioGroupItem>
          </div>
        </div>
      </RadioGroupRoot>
    </div>

    <!-- Movement to Target Progress -->
    <div v-if="evalResult.targetGrade && targetProgress" class="space-y-2 pt-3 border-t border-[var(--surface-2)]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
        <div class="text-[var(--text-secondary)]">
          Движение к <strong class="text-[var(--accent)] font-mono">{{ evalResult.targetGrade }}</strong>
          <span class="text-[var(--text-tertiary)] ml-1.5">({{ GRADE_DETAILS[evalResult.targetGrade].label }})</span>
          <span v-if="evalResult.isTargetManual" class="ml-2 text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded">
            ручная цель
          </span>
        </div>
        <div class="text-[11px] font-mono text-[var(--text-tertiary)] flex items-center gap-3">
          <span>
            Обязательные:
            <span :class="targetProgress.mandatoryCoverage === 1 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'">
              {{ targetProgress.completedMandatory }}/{{ targetProgress.totalMandatory }}
            </span>
          </span>
          <span>
            Желательные (≥70%):
            <span :class="targetProgress.desirableCoverage >= 0.7 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'">
              {{ targetProgress.completedDesirable }}/{{ targetProgress.totalDesirable }}
            </span>
          </span>
          <span class="text-[var(--text-primary)] font-semibold">
            {{ evalResult.targetGradeProgressPercent }}%
          </span>
        </div>
      </div>
      <ProgressBar :value="evalResult.targetGradeProgressPercent" color="accent" size="sm" />

      <!-- Intermediate steps breakdown (when manual target is multiple steps ahead) -->
      <div v-if="intermediateGrades.length > 0" class="pt-2 text-[11px] font-mono text-[var(--text-tertiary)] space-y-1">
        <div class="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Промежуточные ступени:</div>
        <div class="flex flex-wrap gap-3">
          <span
            v-for="ig in intermediateGrades"
            :key="ig"
            :class="evalResult.gradesProgress[ig]?.mandatoryCoverage === 1 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'"
          >
            {{ ig }}: {{ evalResult.gradesProgress[ig]?.completedMandatory }}/{{ evalResult.gradesProgress[ig]?.totalMandatory }} обяз.
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
