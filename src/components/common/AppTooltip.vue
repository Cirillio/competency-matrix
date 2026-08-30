<script setup lang="ts">
import { TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui';

withDefaults(
  defineProps<{
    label: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
  }>(),
  { side: 'bottom' }
);
</script>

<template>
  <TooltipRoot>
    <!-- as-child keeps the caller's own button as the trigger element -->
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side"
        :side-offset="6"
        class="overlay-surface z-50 px-2 py-1 text-[11px] text-(--text-primary) select-none
               data-[state=delayed-open]:animate-[pop-in_160ms_ease-out]
               data-[state=closed]:animate-[pop-out_120ms_ease-out]"
      >
        {{ label }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
