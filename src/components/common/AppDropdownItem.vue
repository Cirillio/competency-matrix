<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

withDefaults(
  defineProps<{ tone?: 'neutral' | 'critical' }>(),
  { tone: 'neutral' }
);

const emit = defineEmits<{ (e: 'select'): void }>();
</script>

<template>
  <DropdownMenuItem
    :class="[
      'min-h-11 sm:min-h-9 px-2.5 rounded-md text-xs flex items-center gap-2.5',
      'cursor-pointer select-none outline-none transition-colors',
      'data-[highlighted]:bg-(--surface-3)',
      tone === 'critical'
        ? 'text-(--text-secondary) data-[highlighted]:text-(--critical)'
        : 'text-(--text-secondary) data-[highlighted]:text-(--text-primary)',
    ]"
    @select="emit('select')"
  >
    <slot />
  </DropdownMenuItem>
</template>
