<script setup lang="ts">
import { ref } from 'vue';
import type { SkillItem } from '../../types/matrix';
import { useProgressStore } from '../../stores/progress';
import SkillRow from './SkillRow.vue';
import { ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  id: string;
  name: string;
  category: string;
  section: string;
  skills: SkillItem[];
  defaultExpanded?: boolean;
}>();

const progressStore = useProgressStore();
const isExpanded = ref(props.defaultExpanded ?? false);

const completedCount = computed(() => {
  return props.skills.filter((s) => progressStore.isSkillCompleted(s.id)).length;
});
</script>

<script lang="ts">
import { computed } from 'vue';
</script>

<template>
  <div class="space-y-2">
    <!-- Competency Header -->
    <button
      type="button"
      @click="isExpanded = !isExpanded"
      class="w-full px-4 py-2.5 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div class="flex items-center gap-2.5 truncate">
        <ChevronRight
          :class="[
            'w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 shrink-0',
            isExpanded ? 'rotate-90 text-[var(--text-primary)]' : ''
          ]"
        />
        <span class="text-sm font-semibold text-[var(--text-primary)] truncate">
          {{ name }}
        </span>
        <span class="text-xs text-[var(--text-tertiary)] truncate">
          {{ section }}
        </span>
      </div>

      <!-- Counter -->
      <span class="text-xs font-mono text-[var(--text-secondary)] shrink-0">
        <strong :class="completedCount === skills.length ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'">
          {{ completedCount }}
        </strong>
        <span class="text-[var(--text-tertiary)]">/{{ skills.length }}</span>
      </span>
    </button>

    <!-- Skills Rows List -->
    <div v-if="isExpanded" class="space-y-1 pl-2 sm:pl-3">
      <SkillRow
        v-for="skill in skills"
        :key="skill.id"
        :skill="skill"
      />
    </div>
  </div>
</template>
