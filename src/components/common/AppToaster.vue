<script setup lang="ts">
import { ToastProvider, ToastRoot, ToastTitle, ToastDescription, ToastViewport } from 'reka-ui';
import { useToast } from '../../composables/useToast';

const { items, dismiss } = useToast();

const toneClass: Record<string, string> = {
  neutral: 'text-(--text-primary)',
  critical: 'text-(--critical)',
  success: 'text-(--success)',
};
</script>

<template>
  <ToastProvider :duration="4500" label="Уведомления" swipe-direction="right">
    <ToastRoot
      v-for="toast in items"
      :key="toast.id"
      :open="true"
      class="overlay-surface p-3.5 pointer-events-auto
             data-[state=open]:animate-[toast-in_200ms_ease-out]
             data-[swipe=move]:translate-x-(--reka-toast-swipe-move-x)
             data-[swipe=cancel]:translate-x-0"
      @update:open="(v: boolean) => { if (!v) dismiss(toast.id) }"
    >
      <ToastTitle :class="['text-xs font-semibold', toneClass[toast.tone]]">
        {{ toast.title }}
      </ToastTitle>
      <ToastDescription v-if="toast.description" class="mt-1 text-[11px] text-(--text-secondary)">
        {{ toast.description }}
      </ToastDescription>
    </ToastRoot>

    <ToastViewport
      class="fixed bottom-0 right-0 z-[60] m-4 flex w-[min(22rem,calc(100vw-2rem))]
             flex-col gap-2 outline-none pointer-events-none"
    />
  </ToastProvider>
</template>
