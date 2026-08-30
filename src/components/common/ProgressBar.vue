<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number; // 0..100
    color?: 'accent' | 'critical' | 'success';
    size?: 'sm' | 'md';
  }>(),
  {
    color: 'accent',
    size: 'sm',
  }
);

const clampedValue = computed(() => Math.min(100, Math.max(0, props.value)));

const heightClass = computed(() => (props.size === 'sm' ? 'h-1.5' : 'h-2'));

const barColorClass = computed(() => {
  switch (props.color) {
    case 'critical':
      return 'bg-[var(--critical)]';
    case 'success':
      return 'bg-[var(--success)]';
    default:
      return 'bg-[var(--accent)]';
  }
});
</script>

<template>
  <div class="w-full">
    <div :class="['w-full bg-[var(--surface-2)] rounded-full overflow-hidden', heightClass]">
      <div
        :class="['h-full transition-all duration-300 ease-out rounded-full', barColorClass]"
        :style="{ width: `${clampedValue}%` }"
      />
    </div>
  </div>
</template>
