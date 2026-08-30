<script setup lang="ts">
import { computed } from 'vue';
import type { SkillItem } from '../../types/matrix';
import { useProgressStore } from '../../stores/progress';
import AppDialog from '../common/AppDialog.vue';
import Badge from '../common/Badge.vue';
import { PhArrowSquareOut } from '@phosphor-icons/vue';

const props = defineProps<{ skill: SkillItem }>();
const open = defineModel<boolean>('open', { default: false });

const progressStore = useProgressStore();
const record = computed(() => progressStore.getSkillRecord(props.skill.id));
</script>

<template>
  <AppDialog
    v-model:open="open"
    :title="skill.title"
    :description="`${skill.competencyName} · ${skill.section}`"
  >
    <div class="space-y-5">
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="grade" :grade="skill.grade" size="sm" />
        <Badge variant="requirement" :requirement="skill.requirement" size="sm" />
        <span v-if="record?.completedAt" class="text-[11px] font-mono text-(--text-tertiary)">
          сдано {{ new Date(record.completedAt).toLocaleDateString('ru-RU') }}
        </span>
      </div>

      <p class="text-xs leading-relaxed text-(--text-secondary)">
        {{ skill.description }}
      </p>

      <div v-if="skill.topics.length > 0" class="space-y-2">
        <h4 class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">Темы</h4>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="topic in skill.topics"
            :key="topic"
            class="px-2 py-1 rounded-md bg-(--surface-1) text-[11px] text-(--text-secondary)"
          >
            {{ topic }}
          </span>
        </div>
      </div>

      <div v-if="skill.links.length > 0" class="space-y-2">
        <h4 class="text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">Источники</h4>
        <div class="flex flex-col gap-1.5 items-start">
          <a
            v-for="link in skill.links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-[11px] text-(--accent) hover:underline rounded
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <span>{{ link.title }}</span>
            <PhArrowSquareOut :size="14" class="shrink-0" />
          </a>
        </div>
      </div>
    </div>
  </AppDialog>
</template>
