<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SkillItem } from '../../types/matrix';
import { useProgressStore } from '../../stores/progress';
import Badge from '../common/Badge.vue';
import { Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-vue-next';

const props = defineProps<{
  skill: SkillItem;
}>();

const progressStore = useProgressStore();

const isCompleted = computed(() => progressStore.isSkillCompleted(props.skill.id));
const skillRecord = computed(() => progressStore.getSkillRecord(props.skill.id));
const isGap = computed(() => progressStore.gapSkillIds.has(props.skill.id));

const isExpanded = ref(false);
const notes = ref(skillRecord.value?.notes || '');

function handleToggle(e: Event) {
  e.stopPropagation();
  progressStore.toggleSkill(props.skill.id, notes.value || undefined);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    progressStore.toggleSkill(props.skill.id, notes.value || undefined);
  }
}

function handleNotesBlur() {
  progressStore.updateSkillNotes(props.skill.id, notes.value);
}
</script>

<template>
  <div class="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] rounded-lg transition-colors overflow-hidden">
    <!-- Main Row -->
    <div
      @click="isExpanded = !isExpanded"
      class="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none"
    >
      <!-- Left: Checkbox + Title -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Accessible Checkbox -->
        <button
          type="button"
          role="checkbox"
          :aria-checked="isCompleted"
          :aria-label="`Отметить навык ${skill.title}`"
          @click="handleToggle"
          @keydown="handleKeydown"
          :class="[
            'w-4.5 h-4.5 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            isCompleted
              ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
              : 'border-[var(--text-tertiary)] bg-[var(--surface-2)] hover:border-[var(--text-secondary)] text-transparent'
          ]"
        >
          <Check class="w-3 h-3 stroke-[3]" />
        </button>

        <!-- Title -->
        <div class="truncate text-sm">
          <span
            :class="[
              'transition-colors',
              isCompleted
                ? 'text-[var(--text-tertiary)] line-through'
                : isGap
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-primary)]'
            ]"
          >
            {{ skill.title }}
          </span>
          <span
            v-if="skillRecord?.notes"
            class="ml-2 text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-subtle)] px-1 rounded"
          >
            заметка
          </span>
        </div>
      </div>

      <!-- Right: Grade + Requirement + Expand Chevron -->
      <div class="flex items-center gap-3 shrink-0">
        <Badge variant="grade" :grade="skill.grade" size="sm" />
        <Badge variant="requirement" :requirement="skill.requirement" size="sm" />
        <button
          type="button"
          :aria-label="isExpanded ? 'Свернуть детали' : 'Развернуть детали'"
          class="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
        >
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Expandable Details Drawer -->
    <div
      v-if="isExpanded"
      class="px-4 pb-4 pt-1 space-y-3 bg-[var(--surface-0)]/50 border-t border-[var(--surface-2)] text-xs"
    >
      <!-- Description -->
      <p class="text-[var(--text-secondary)] leading-relaxed pt-2">
        {{ skill.description }}
      </p>

      <!-- Topics Chips -->
      <div v-if="skill.topics.length > 0" class="flex flex-wrap gap-1.5">
        <span
          v-for="topic in skill.topics"
          :key="topic"
          class="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)]"
        >
          {{ topic }}
        </span>
      </div>

      <!-- Official Links -->
      <div v-if="skill.links.length > 0" class="flex flex-wrap items-center gap-3 pt-1">
        <a
          v-for="link in skill.links"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
        >
          <span>{{ link.title }}</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>

      <!-- Notes Field -->
      <div class="pt-2">
        <textarea
          v-model="notes"
          @blur="handleNotesBlur"
          aria-label="Личные заметки к навыку"
          placeholder="Личные заметки, вопросы для собеседования, код-памятки..."
          class="w-full bg-[var(--surface-2)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-y min-h-[56px]"
        />
        <div v-if="skillRecord?.completedAt" class="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
          Сдано: {{ new Date(skillRecord.completedAt).toLocaleDateString() }}
        </div>
      </div>
    </div>
  </div>
</template>
