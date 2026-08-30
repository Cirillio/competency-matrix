<script setup lang="ts">
import { computed } from 'vue';
import type { Grade, RequirementLevel } from '../../types/matrix';

const props = withDefaults(
  defineProps<{
    variant?: 'grade' | 'requirement' | 'status' | 'default';
    grade?: Grade | 'Pre-E1.1';
    requirement?: RequirementLevel;
    size?: 'sm' | 'md';
  }>(),
  {
    variant: 'default',
    grade: undefined,
    requirement: undefined,
    size: 'sm',
  }
);

const sizeClasses = computed(() => {
  return props.size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';
});

const label = computed(() => {
  if (props.variant === 'requirement' && props.requirement) {
    const labels: Record<RequirementLevel, string> = {
      mandatory: 'Обязательно',
      desirable: 'Желательно',
      additional: 'Дополнительно',
      optional: 'Опционально',
    };
    return labels[props.requirement];
  }
  if (props.variant === 'grade' && props.grade) {
    return props.grade;
  }
  return '';
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded font-mono font-medium tracking-tight select-none',
      variant === 'requirement' && requirement === 'mandatory'
        ? 'text-[var(--critical)] bg-[var(--critical-subtle)]'
        : variant === 'requirement'
        ? 'text-[var(--text-secondary)] bg-[var(--surface-2)]'
        : variant === 'grade'
        ? 'text-[var(--text-primary)] bg-[var(--surface-2)]'
        : 'text-[var(--text-secondary)] bg-[var(--surface-2)]',
      sizeClasses,
    ]"
  >
    <span
      v-if="variant === 'requirement' && requirement === 'mandatory'"
      class="w-1 h-1 rounded-full bg-[var(--critical)] shrink-0"
    />
    <slot>{{ label }}</slot>
  </span>
</template>
