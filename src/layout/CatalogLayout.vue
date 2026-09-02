<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { TooltipProvider } from 'reka-ui';
import { APP_NAME_SHORT } from '../config/app';
import AppToaster from '../components/common/AppToaster.vue';
import { PhArrowRight } from '@phosphor-icons/vue';
</script>

<template>
  <TooltipProvider :delay-duration="400" :skip-delay-duration="300">
    <div
      class="min-h-screen bg-(--surface-0) text-(--text-primary) flex flex-col font-sans
             selection:bg-(--accent-subtle) selection:text-(--accent)"
    >
      <header class="bg-(--surface-0) sticky top-0 z-30 px-4 sm:px-6">
        <div class="max-w-[1100px] mx-auto h-14 flex items-center justify-between gap-4">
          <h1 class="flex items-baseline gap-1.5 select-none">
            <span class="text-[15px] font-semibold tracking-[-0.01em] text-(--text-primary)">
              {{ APP_NAME_SHORT }}
            </span>
            <span class="hidden sm:inline text-[13px] font-normal text-(--text-tertiary)">
              компетенций
            </span>
          </h1>

          <RouterLink
            to="/tracker"
            class="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-(--surface-2)
                   text-xs text-(--text-secondary) transition-colors hover:bg-(--surface-3) hover:text-(--text-primary)
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <span>Открыть трекер</span>
            <PhArrowRight :size="14" />
          </RouterLink>
        </div>
      </header>

      <main class="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <slot />
      </main>
    </div>

    <AppToaster />
  </TooltipProvider>
</template>
