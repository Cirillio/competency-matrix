<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'icon';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
  }>(),
  {
    variant: 'secondary',
    size: 'sm',
    disabled: false,
    type: 'button',
    ariaLabel: undefined,
  }
);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-[var(--accent)] hover:opacity-90 text-white font-medium';
    case 'danger':
      return 'bg-[var(--critical-subtle)] text-[var(--critical)] hover:bg-[var(--critical)] hover:text-white';
    case 'ghost':
      return 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]';
    default:
      return 'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]';
  }
});

const sizeClasses = computed(() => {
  if (props.size === 'icon') return 'p-2 rounded-lg';
  if (props.size === 'md') return 'px-3.5 py-1.5 text-sm gap-2 rounded-lg';
  return 'px-2.5 py-1 text-xs gap-1.5 rounded-md';
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="[
      'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
      variantClasses,
      sizeClasses,
    ]"
    @click="(e) => emit('click', e)"
  >
    <slot />
  </button>
</template>
