<script setup lang="ts">
import { computed } from 'vue';
import { AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent } from 'reka-ui';
import type { SkillItem } from '../../types/matrix';
import { useProgressStore } from '../../stores/progress';
import SkillRow from './SkillRow.vue';
import { PhCaretRight } from '@phosphor-icons/vue';

const props = defineProps<{
  id: string;
  name: string;
  section: string;
  skills: SkillItem[];
}>();

const progressStore = useProgressStore();

const completedCount = computed(
  () => props.skills.filter((s) => progressStore.isSkillCompleted(s.id)).length
);

const percent = computed(() =>
  props.skills.length === 0 ? 0 : Math.round((completedCount.value / props.skills.length) * 100)
);

const isComplete = computed(() => completedCount.value === props.skills.length);
</script>

<template>
  <AccordionItem :value="id" class="rounded-xl bg-(--surface-1) overflow-hidden">
    <AccordionHeader as="h3">
      <AccordionTrigger
        class="group w-full min-h-12 px-3 flex items-center gap-3 text-left cursor-pointer
               transition-colors hover:bg-(--surface-2)
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        <PhCaretRight
          :size="14"
          class="shrink-0 text-(--text-tertiary) transition-transform duration-200
                 group-data-[state=open]:rotate-90"
        />

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px] font-medium text-(--text-primary)">{{ name }}</span>
          <span class="block truncate text-[11px] text-(--text-tertiary)">{{ section }}</span>
        </span>

        <!-- Thin completion bar doubles as the counter -->
        <span class="shrink-0 flex items-center gap-2.5">
          <span class="hidden sm:block w-16 h-1 rounded-full bg-(--surface-3) overflow-hidden">
            <span
              :class="['block h-full rounded-full transition-all duration-300', isComplete ? 'bg-(--success)' : 'bg-(--accent)']"
              :style="{ width: `${percent}%` }"
            />
          </span>
          <span class="text-[11px] font-mono tabular-nums">
            <span :class="isComplete ? 'text-(--success)' : 'text-(--text-secondary)'">{{ completedCount }}</span>
            <span class="text-(--text-tertiary)">/{{ skills.length }}</span>
          </span>
        </span>
      </AccordionTrigger>
    </AccordionHeader>

    <AccordionContent class="overflow-hidden">
      <div class="p-1.5 pt-0 space-y-1">
        <SkillRow v-for="skill in skills" :key="skill.id" :skill="skill" />
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
