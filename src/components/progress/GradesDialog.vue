<script setup lang="ts">
import { computed } from 'vue';
import { RadioGroupRoot, RadioGroupItem, TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';
import { useProgressStore } from '../../stores/progress';
import { ORDERED_GRADES, type Grade } from '../../types/matrix';
import { GRADE_DETAILS, TIERS } from '../../config/grades';
import AppDialog from '../common/AppDialog.vue';
import ProgressBar from '../common/ProgressBar.vue';
import { PhArrowCounterClockwise, PhCheck } from '@phosphor-icons/vue';

const open = defineModel<boolean>('open', { default: false });

const progressStore = useProgressStore();
const evalResult = computed(() => progressStore.evaluation);

const currentIndex = computed(() => {
  if (evalResult.value.currentGrade === 'Pre-E1.1') return -1;
  return ORDERED_GRADES.indexOf(evalResult.value.currentGrade as Grade);
});

function isSelectable(grade: Grade): boolean {
  return ORDERED_GRADES.indexOf(grade) > currentIndex.value;
}

/** certified but not part of the unbroken chain from E1.1 — shown differently */
function isOutOfChain(grade: Grade): boolean {
  return (
    evalResult.value.gradesProgress[grade].isCertified &&
    !evalResult.value.certifiedGrades.includes(grade)
  );
}

function handleTargetSelect(val: unknown) {
  if (typeof val !== 'string' || !val) return;
  const grade = val as Grade;
  if (grade === evalResult.value.targetGrade && evalResult.value.isTargetManual) {
    progressStore.setTargetGrade(null);
  } else {
    progressStore.setTargetGrade(grade);
  }
}

const targetProgress = computed(() => {
  const t = evalResult.value.targetGrade;
  return t ? evalResult.value.gradesProgress[t] : null;
});

/** Grades sitting between the current one and a manually set, further-out target. */
const intermediateGrades = computed<Grade[]>(() => {
  const target = evalResult.value.targetGrade;
  if (!target || !evalResult.value.isTargetManual) return [];
  const targetIdx = ORDERED_GRADES.indexOf(target);
  if (targetIdx <= currentIndex.value + 1) return [];
  return ORDERED_GRADES.slice(currentIndex.value + 1, targetIdx);
});

const specializations = computed(() =>
  Object.values(evalResult.value.bonusSpecializations)
    .filter((s) => s.completedBonusSkills > 0)
    .sort((a, b) => b.percent - a.percent)
);
</script>

<template>
  <AppDialog
    v-model:open="open"
    size="lg"
    title="Грейды"
    description="Выберите ступень, к которой идёте. Цель определяет список блокеров."
  >
    <TabsRoot default-value="ladder" class="flex flex-col gap-4">
      <TabsList class="flex items-center gap-1 p-1 rounded-lg bg-(--surface-1) self-start" aria-label="Разделы">
        <TabsTrigger
          v-for="tab in [{ v: 'ladder', l: 'Лестница' }, { v: 'bonus', l: 'Специализации' }]"
          :key="tab.v"
          :value="tab.v"
          class="min-h-9 px-3 rounded-md text-xs cursor-pointer transition-colors outline-none
                 text-(--text-tertiary) hover:text-(--text-secondary)
                 data-[state=active]:bg-(--surface-3) data-[state=active]:text-(--text-primary)
                 focus-visible:ring-2 focus-visible:ring-(--accent)"
        >
          {{ tab.l }}
        </TabsTrigger>
      </TabsList>

      <!-- ─── Ladder ─── -->
      <TabsContent value="ladder" class="outline-none space-y-5">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] text-(--text-tertiary)">
            Ступени ниже текущей уже пройдены и недоступны для выбора.
          </p>
          <button
            v-if="evalResult.isTargetManual"
            type="button"
            class="shrink-0 inline-flex items-center gap-1.5 text-[11px] text-(--accent) cursor-pointer
                   hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) rounded"
            @click="progressStore.setTargetGrade(null)"
          >
            <PhArrowCounterClockwise :size="14" />
            <span>Вернуть авто-цель</span>
          </button>
        </div>

        <RadioGroupRoot
          :model-value="evalResult.targetGrade ?? ''"
          aria-label="Целевой грейд"
          class="space-y-4"
          @update:model-value="handleTargetSelect"
        >
          <section v-for="tier in TIERS" :key="tier.name" class="space-y-2">
            <h3 class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
              {{ tier.name }}
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RadioGroupItem
                v-for="grade in tier.grades"
                :key="grade"
                :value="grade"
                :disabled="!isSelectable(grade)"
                :class="[
                  'p-3 rounded-xl text-left outline-none transition-colors border-0 min-h-16',
                  'flex items-center justify-between gap-3',
                  'focus-visible:ring-2 focus-visible:ring-(--accent)',
                  grade === evalResult.targetGrade
                    ? 'bg-(--accent) text-white cursor-pointer'
                    : evalResult.certifiedGrades.includes(grade)
                      ? 'bg-(--success-subtle) text-(--success)'
                      : isOutOfChain(grade)
                        ? 'bg-(--surface-3) text-(--text-secondary)'
                        : isSelectable(grade)
                          ? 'bg-(--surface-1) text-(--text-primary) hover:bg-(--surface-3) cursor-pointer'
                          : 'bg-(--surface-1) text-(--text-tertiary) opacity-60 cursor-default',
                ]"
              >
                <span class="min-w-0">
                  <span class="block text-sm font-medium truncate">{{ GRADE_DETAILS[grade].label }}</span>
                  <span class="block text-[11px] opacity-75 truncate">{{ GRADE_DETAILS[grade].shortLabel }}</span>
                </span>

                <span class="shrink-0 text-right">
                  <span class="block text-[11px] font-mono opacity-80">{{ grade }}</span>
                  <span class="block text-[11px] font-mono mt-0.5">
                    <PhCheck v-if="evalResult.certifiedGrades.includes(grade)" class="w-3.5 h-3.5 inline" />
                    <template v-else>
                      {{ evalResult.gradesProgress[grade].completedMandatory }}/{{ evalResult.gradesProgress[grade].totalMandatory }}
                    </template>
                  </span>
                </span>
              </RadioGroupItem>
            </div>
          </section>
        </RadioGroupRoot>

        <!-- Breakdown for the effective target -->
        <div v-if="targetProgress && evalResult.targetGrade" class="rounded-xl bg-(--surface-1) p-4 space-y-3">
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-xs text-(--text-secondary)">
              До <strong class="text-(--text-primary)">{{ GRADE_DETAILS[evalResult.targetGrade].label }}</strong>
            </span>
            <span class="text-xs font-mono font-semibold text-(--text-primary)">
              {{ evalResult.targetGradeProgressPercent }}%
            </span>
          </div>

          <ProgressBar :value="evalResult.targetGradeProgressPercent" color="accent" size="sm" />

          <div class="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-mono text-(--text-tertiary)">
            <span>
              Обязательные
              <span :class="targetProgress.mandatoryCoverage === 1 ? 'text-(--success)' : 'text-(--text-secondary)'">
                {{ targetProgress.completedMandatory }}/{{ targetProgress.totalMandatory }}
              </span>
            </span>
            <span>
              Желательные ≥70%
              <span :class="targetProgress.desirableCoverage >= 0.7 ? 'text-(--success)' : 'text-(--text-secondary)'">
                {{ targetProgress.completedDesirable }}/{{ targetProgress.totalDesirable }}
              </span>
            </span>
          </div>

          <div v-if="intermediateGrades.length > 0" class="pt-2 space-y-1.5">
            <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
              Промежуточные ступени
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
              <span
                v-for="ig in intermediateGrades"
                :key="ig"
                :class="evalResult.gradesProgress[ig].mandatoryCoverage === 1 ? 'text-(--success)' : 'text-(--text-secondary)'"
              >
                {{ GRADE_DETAILS[ig].label }}
                {{ evalResult.gradesProgress[ig].completedMandatory }}/{{ evalResult.gradesProgress[ig].totalMandatory }}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ─── Bonus specialisations ─── -->
      <TabsContent value="bonus" class="outline-none">
        <div v-if="specializations.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="spec in specializations"
            :key="spec.competencyId"
            class="rounded-xl bg-(--surface-1) p-3 space-y-2"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-xs text-(--text-primary) truncate">{{ spec.competencyName }}</span>
              <span class="shrink-0 text-[11px] font-mono text-(--text-tertiary)">
                {{ spec.completedBonusSkills }}/{{ spec.totalBonusSkills }}
              </span>
            </div>
            <ProgressBar :value="spec.percent" color="accent" size="sm" />
          </div>
        </div>
        <p v-else class="text-xs text-(--text-tertiary) py-6 text-center">
          Пока нет закрытых дополнительных навыков.
        </p>
      </TabsContent>
    </TabsRoot>
  </AppDialog>
</template>
