<script setup lang="ts">
import {
  SelectRoot, SelectTrigger, SelectValue, SelectIcon, SelectPortal,
  SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator,
} from 'reka-ui';
import { PhCaretDown, PhCheck } from '@phosphor-icons/vue';

export interface SelectOption {
  value: string;
  label: string;
}

defineProps<{
  options: SelectOption[];
  label: string;
  placeholder?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="space-y-1">
    <span class="block text-[10px] font-mono text-(--text-tertiary)">{{ label }}</span>
    <SelectRoot v-model="model">
      <SelectTrigger
        :aria-label="label"
        class="w-full min-h-11 sm:min-h-9 px-2.5 rounded-lg bg-(--surface-2) text-xs text-(--text-primary)
               flex items-center justify-between gap-2 cursor-pointer transition-colors
               hover:bg-(--surface-3) data-[placeholder]:text-(--text-tertiary)
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        <SelectValue :placeholder="placeholder ?? label" class="truncate text-left" />
        <SelectIcon class="shrink-0 text-(--text-tertiary)">
          <PhCaretDown :size="16" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          :collision-padding="12"
          class="overlay-surface z-50 min-w-(--reka-select-trigger-width) max-h-72 overflow-hidden
                 data-[state=open]:animate-[pop-in_160ms_ease-out]
                 data-[state=closed]:animate-[pop-out_120ms_ease-out]"
        >
          <SelectViewport class="p-1">
            <SelectItem
              v-for="opt in options"
              :key="opt.value"
              :value="opt.value"
              class="min-h-10 sm:min-h-8 px-2 pr-7 rounded-md text-xs text-(--text-secondary) relative
                     flex items-center cursor-pointer select-none outline-none
                     data-[highlighted]:bg-(--surface-3) data-[highlighted]:text-(--text-primary)
                     data-[state=checked]:text-(--text-primary)"
            >
              <SelectItemText>{{ opt.label }}</SelectItemText>
              <SelectItemIndicator class="absolute right-2 inline-flex items-center text-(--accent)">
                <PhCheck :size="16" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>
