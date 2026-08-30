<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui';
import { PhX } from '@phosphor-icons/vue';

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    /** Below 640px the panel becomes a bottom sheet instead of a centred card. */
    size?: 'md' | 'lg';
  }>(),
  { description: undefined, size: 'md' }
);

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/70
               data-[state=open]:animate-[overlay-in_180ms_ease-out]
               data-[state=closed]:animate-[overlay-out_140ms_ease-out]"
      />
      <DialogContent
        :class="[
          'fixed z-50 overlay-surface flex flex-col outline-none',
          // Mobile: bottom sheet pinned to the viewport bottom.
          'inset-x-0 bottom-0 max-h-[90dvh] rounded-b-none',
          // Desktop: centred card.
          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-[calc(100vw-4rem)] sm:max-h-[85dvh] sm:rounded-2xl',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
          'data-[state=open]:animate-[sheet-in_200ms_ease-out]',
          'data-[state=closed]:animate-[sheet-out_150ms_ease-out]',
        ]"
      >
        <header class="flex items-start justify-between gap-4 px-5 pt-5 pb-3 shrink-0">
          <div class="min-w-0">
            <DialogTitle class="text-base font-semibold tracking-tight text-(--text-primary)">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-xs text-(--text-secondary)">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Закрыть"
            class="shrink-0 -mr-1 -mt-1 p-2 rounded-lg text-(--text-tertiary) hover:text-(--text-primary)
                   hover:bg-(--surface-3) cursor-pointer transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <PhX :size="18" />
          </DialogClose>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <slot :close="() => (open = false)" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
