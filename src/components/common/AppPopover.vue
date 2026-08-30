<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';

withDefaults(
  defineProps<{
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    widthClass?: string;
  }>(),
  { side: 'bottom', align: 'start', widthClass: 'w-[min(22rem,calc(100vw-2rem))]' }
);

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="8"
        :collision-padding="12"
        :class="[
          'overlay-surface z-50 p-4 outline-none',
          widthClass,
          'data-[state=open]:animate-[pop-in_180ms_ease-out]',
          'data-[state=closed]:animate-[pop-out_140ms_ease-out]',
        ]"
      >
        <slot :close="() => (open = false)" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
