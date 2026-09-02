<script setup lang="ts">
import { computed, ref } from 'vue';
import { useProgressStore } from '../../stores/progress';
import { useFilterStore } from '../../stores/filter';
import { GRADE_DETAILS } from '../../config/grades';
import { COPY } from '../../config/copy';
import ProgressBar from '../common/ProgressBar.vue';
import AppPopover from '../common/AppPopover.vue';
import AppTooltip from '../common/AppTooltip.vue';
import GradesDialog from './GradesDialog.vue';
import { PhArrowRight, PhListChecks } from '@phosphor-icons/vue';

const progressStore = useProgressStore();
const filterStore = useFilterStore();

const gradesDialogOpen = ref(false);
const gapPopoverOpen = ref(false);

const evalResult = computed(() => progressStore.evaluation);
const currentMeta = computed(() => GRADE_DETAILS[evalResult.value.currentGrade]);
const targetMeta = computed(() => {
  const t = evalResult.value.targetGrade;
  return t ? GRADE_DETAILS[t] : null;
});

const gapSkills = computed(() => evalResult.value.gapSkills);

function jumpToGapInMatrix() {
  filterStore.showGapInMatrix();
  gapPopoverOpen.value = false;
}
</script>

<template>
  <section class="rounded-2xl bg-(--surface-1) p-5 space-y-4">
    <!-- Current level — plain heading, not a hidden button -->
    <div>
      <span class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
        Сейчас
      </span>
      <span class="mt-1 flex items-baseline gap-2">
        <span class="text-3xl font-semibold tracking-tight text-(--text-primary)">
          {{ currentMeta.label }}
        </span>
        <span class="text-xs font-mono text-(--text-tertiary)">{{ evalResult.currentGrade }}</span>
      </span>
      <span class="block text-xs text-(--text-secondary)">{{ currentMeta.shortLabel }}</span>
    </div>

    <!-- Movement to target -->
    <div v-if="targetMeta" class="space-y-2">
      <div class="flex items-baseline justify-between gap-2 text-xs">
        <span class="text-(--text-secondary) truncate">
          {{ COPY.targetLabel }} — {{ targetMeta.label }}
          <span v-if="evalResult.isTargetManual" class="text-(--accent)">·&nbsp;выбрана вручную</span>
        </span>
        <span class="shrink-0 font-mono font-semibold text-(--text-primary)">
          {{ evalResult.targetGradeProgressPercent }}%
        </span>
      </div>
      <ProgressBar :value="evalResult.targetGradeProgressPercent" color="accent" size="sm" />
    </div>

    <!-- Explicit control: this is what opens the full ladder -->
    <AppTooltip :label="COPY.levelsHint">
      <button
        type="button"
        class="w-full min-h-10 px-3 inline-flex items-center justify-between gap-2 rounded-xl
               bg-(--surface-2) text-xs text-(--text-secondary) cursor-pointer transition-colors
               hover:bg-(--surface-3) hover:text-(--text-primary)
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        @click="gradesDialogOpen = true"
      >
        <span class="inline-flex items-center gap-2">
          <PhListChecks :size="15" class="shrink-0" />
          {{ COPY.levelsAction }}
        </span>
        <PhArrowRight :size="14" class="shrink-0" />
      </button>
    </AppTooltip>

    <!-- Secondary counters -->
    <div class="flex items-center gap-6 text-xs pt-1">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
          {{ COPY.coverageLabel }}
        </div>
        <div class="mt-0.5 font-mono text-(--text-primary)">{{ evalResult.matrixProgressPercent }}%</div>
      </div>

      <AppPopover v-model:open="gapPopoverOpen" side="bottom" align="start">
        <template #trigger>
          <button
            type="button"
            :disabled="gapSkills.length === 0"
            :aria-label="COPY.gapLong"
            class="text-left rounded-lg cursor-pointer disabled:cursor-default group
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <span class="block text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
              {{ COPY.gapLabel }}
            </span>
            <span class="mt-0.5 flex items-center gap-1.5">
              <span
                v-if="gapSkills.length > 0"
                class="w-1.5 h-1.5 rounded-full bg-(--critical) shrink-0"
              />
              <span
                :class="[
                  'font-mono',
                  gapSkills.length > 0
                    ? 'text-(--critical) border-b border-dotted border-(--critical)/50 group-hover:border-(--critical)'
                    : 'text-(--text-primary)',
                ]"
              >
                {{ gapSkills.length }}
              </span>
            </span>
          </button>
        </template>

        <div class="space-y-3">
          <div class="space-y-1">
            <h3 class="text-xs font-semibold text-(--text-primary)">{{ COPY.gapLong }}</h3>
            <p class="text-[11px] text-(--text-tertiary)">
              Обязательные навыки до уровня {{ targetMeta?.label ?? '' }}
            </p>
          </div>

          <ul class="space-y-1.5 max-h-64 overflow-y-auto">
            <li
              v-for="skill in gapSkills.slice(0, 8)"
              :key="skill.id"
              class="flex items-baseline gap-2 text-[11px]"
            >
              <span class="shrink-0 font-mono text-(--text-tertiary)">{{ skill.grade }}</span>
              <span class="min-w-0 truncate text-(--text-secondary)">{{ skill.title }}</span>
            </li>
          </ul>

          <p v-if="gapSkills.length > 8" class="text-[11px] text-(--text-tertiary)">
            и ещё {{ gapSkills.length - 8 }}
          </p>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-[11px] text-(--accent) cursor-pointer hover:underline
                   rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="jumpToGapInMatrix"
          >
            Показать в списке
            <PhArrowRight :size="14" />
          </button>
        </div>
      </AppPopover>
    </div>

    <GradesDialog v-model:open="gradesDialogOpen" />
  </section>
</template>
