<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui';
import type { SkillItem } from '../../types/matrix';
import { useProgressStore } from '../../stores/progress';
import Badge from '../common/Badge.vue';
import AppPopover from '../common/AppPopover.vue';
import SkillDetailsDialog from './SkillDetailsDialog.vue';
import { PhCheck, PhNotePencil } from '@phosphor-icons/vue';

const props = defineProps<{ skill: SkillItem }>();

const progressStore = useProgressStore();

const isCompleted = computed(() => progressStore.isSkillCompleted(props.skill.id));
const skillRecord = computed(() => progressStore.getSkillRecord(props.skill.id));
const isGap = computed(() => progressStore.gapSkillIds.has(props.skill.id));

const detailsOpen = ref(false);
const notesOpen = ref(false);
const notes = ref(skillRecord.value?.notes ?? '');

// Keep the draft in sync when the record changes underneath (import, remote sync).
watch(
  () => skillRecord.value?.notes,
  (incoming) => {
    if (!notesOpen.value) notes.value = incoming ?? '';
  }
);

function handleCheckedChange(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return;
  progressStore.toggleSkill(props.skill.id, notes.value || undefined);
}

function persistNotes() {
  if ((skillRecord.value?.notes ?? '') !== notes.value) {
    progressStore.updateSkillNotes(props.skill.id, notes.value);
  }
}

// Closing the popover (Escape, outside click) must not lose an unsaved draft.
watch(notesOpen, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) persistNotes();
});
</script>

<template>
  <div
    class="group flex items-center gap-3 pl-3 pr-2 min-h-12 rounded-lg
           bg-(--surface-1) hover:bg-(--surface-2) transition-colors"
  >
    <CheckboxRoot
      :model-value="isCompleted"
      :aria-label="`Отметить навык: ${skill.title}`"
      :class="[
        'w-5 h-5 shrink-0 rounded-md flex items-center justify-center cursor-pointer transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
        isCompleted ? 'bg-(--accent) text-white' : 'bg-(--surface-3) text-transparent hover:bg-(--surface-3)',
      ]"
      @update:model-value="handleCheckedChange"
    >
      <CheckboxIndicator class="inline-flex">
        <PhCheck :size="13" weight="bold" />
      </CheckboxIndicator>
    </CheckboxRoot>

    <!-- Title opens the details dialog -->
    <button
      type="button"
      class="min-w-0 flex-1 py-2 text-left cursor-pointer rounded
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      @click="detailsOpen = true"
    >
      <span
        :class="[
          'block truncate text-[13px] transition-colors',
          isCompleted
            ? 'text-(--text-tertiary) line-through'
            : isGap
              ? 'text-(--text-primary) font-medium'
              : 'text-(--text-primary)',
        ]"
      >
        {{ skill.title }}
      </span>
    </button>

    <span
      v-if="isGap && !isCompleted"
      class="w-1.5 h-1.5 rounded-full bg-(--critical) shrink-0"
      aria-hidden="true"
    />

    <!-- Wrappers own the responsive display: a `hidden` class passed to Badge would
         lose to its own `inline-flex` base utility (same specificity, later in source). -->
    <span class="hidden sm:inline-flex shrink-0">
      <Badge variant="grade" :grade="skill.grade" size="sm" />
    </span>
    <span class="hidden md:inline-flex shrink-0">
      <Badge variant="requirement" :requirement="skill.requirement" size="sm" />
    </span>

    <AppPopover
      v-model:open="notesOpen"
      side="left"
      align="start"
      width-class="w-[min(20rem,calc(100vw-2rem))]"
    >
      <template #trigger>
        <button
          type="button"
          :aria-label="skillRecord?.notes ? 'Изменить заметку' : 'Добавить заметку'"
          :class="[
            'shrink-0 p-2 rounded-lg cursor-pointer transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
            skillRecord?.notes
              ? 'text-(--accent)'
              : 'text-(--text-tertiary) opacity-0 group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0',
          ]"
        >
          <PhNotePencil :size="16" />
        </button>
      </template>

      <div class="space-y-2">
        <label :for="`notes-${skill.id}`" class="block text-[11px] text-(--text-secondary)">
          Заметка
        </label>
        <textarea
          :id="`notes-${skill.id}`"
          v-model="notes"
          rows="4"
          placeholder="Вопросы к собеседованию, ссылки, памятки…"
          class="w-full resize-y rounded-lg bg-(--surface-1) p-2.5 text-xs text-(--text-primary)
                 placeholder-(--text-tertiary) focus:outline-none focus:ring-1 focus:ring-(--accent)"
          @blur="persistNotes"
        />
      </div>
    </AppPopover>

    <SkillDetailsDialog v-model:open="detailsOpen" :skill="skill" />
  </div>
</template>
