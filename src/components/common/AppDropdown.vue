<script setup lang="ts">
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent } from 'reka-ui';

withDefaults(
  defineProps<{ align?: 'start' | 'center' | 'end' }>(),
  { align: 'end' }
);
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="6"
        :collision-padding="12"
        class="overlay-surface z-50 min-w-56 p-1 outline-none
               data-[state=open]:animate-[pop-in_160ms_ease-out]
               data-[state=closed]:animate-[pop-out_120ms_ease-out]"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
