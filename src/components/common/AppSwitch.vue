<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';

defineProps<{ label: string }>();
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <SwitchRoot
    :model-value="model"
    :aria-label="label"
    class="relative w-9 h-5 shrink-0 rounded-full cursor-pointer transition-colors
           data-[state=checked]:bg-(--accent) data-[state=unchecked]:bg-(--surface-3)
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
    @update:model-value="(v: boolean) => (model = v)"
  >
    <SwitchThumb
      class="block w-4 h-4 rounded-full bg-white transition-transform translate-x-0.5
             data-[state=checked]:translate-x-[18px]"
    />
  </SwitchRoot>
</template>
