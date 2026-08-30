<script setup lang="ts">
import {
  AlertDialogRoot, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from 'reka-ui';

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'critical' | 'neutral';
  }>(),
  {
    description: undefined,
    confirmLabel: 'Подтвердить',
    cancelLabel: 'Отмена',
    tone: 'critical',
  }
);

const emit = defineEmits<{ (e: 'confirm'): void }>();
const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-40 bg-black/70
               data-[state=open]:animate-[overlay-in_180ms_ease-out]
               data-[state=closed]:animate-[overlay-out_140ms_ease-out]"
      />
      <AlertDialogContent
        class="fixed z-50 overlay-surface outline-none p-5 space-y-4
               inset-x-0 bottom-0 rounded-b-none
               sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
               sm:w-[calc(100vw-4rem)] sm:max-w-sm sm:rounded-2xl
               data-[state=open]:animate-[sheet-in_200ms_ease-out]
               data-[state=closed]:animate-[sheet-out_150ms_ease-out]"
      >
        <div class="space-y-1.5">
          <AlertDialogTitle class="text-sm font-semibold text-(--text-primary)">
            {{ title }}
          </AlertDialogTitle>
          <AlertDialogDescription v-if="description" class="text-xs leading-relaxed text-(--text-secondary)">
            {{ description }}
          </AlertDialogDescription>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <AlertDialogCancel
            class="min-h-11 sm:min-h-9 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
                   bg-(--surface-3) text-(--text-secondary) hover:text-(--text-primary)
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            {{ cancelLabel }}
          </AlertDialogCancel>
          <AlertDialogAction
            :class="[
              'min-h-11 sm:min-h-9 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
              tone === 'critical' ? 'bg-(--critical) text-white' : 'bg-(--accent) text-white',
            ]"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
