<script setup lang="ts">
import { ref } from 'vue';
import { AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent } from 'reka-ui';
import type { SkillItem } from '../../types/matrix';
import Badge from '../common/Badge.vue';
import SkillDetailsDialog from '../matrix/SkillDetailsDialog.vue';
import { PhCaretRight } from '@phosphor-icons/vue';

defineProps<{
  id: string;
  name: string;
  section: string;
  skills: SkillItem[];
}>();

const activeSkill = ref<SkillItem | null>(null);
const detailsOpen = ref(false);

function openSkill(skill: SkillItem) {
  activeSkill.value = skill;
  detailsOpen.value = true;
}
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
        <span class="shrink-0 text-[11px] font-mono text-(--text-tertiary) tabular-nums">
          {{ skills.length }}
        </span>
      </AccordionTrigger>
    </AccordionHeader>

    <AccordionContent
      class="overflow-hidden
             data-[state=open]:animate-[accordion-down_220ms_ease-out]
             data-[state=closed]:animate-[accordion-up_180ms_ease-out]"
    >
      <div class="p-1.5 pt-0 space-y-1">
        <button
          v-for="skill in skills"
          :key="skill.id"
          type="button"
          class="w-full flex items-center gap-3 pl-3 pr-2 min-h-11 rounded-lg text-left
                 bg-(--surface-1) hover:bg-(--surface-2) transition-colors cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          @click="openSkill(skill)"
        >
          <span class="min-w-0 flex-1 text-[13px] text-(--text-primary) truncate">
            {{ skill.title }}
          </span>
          <span class="hidden sm:inline-flex shrink-0">
            <Badge variant="grade" :grade="skill.grade" size="sm" />
          </span>
          <span class="hidden md:inline-flex shrink-0">
            <Badge variant="requirement" :requirement="skill.requirement" size="sm" />
          </span>
        </button>
      </div>
    </AccordionContent>
  </AccordionItem>

  <SkillDetailsDialog v-if="activeSkill" v-model:open="detailsOpen" :skill="activeSkill" />
</template>
