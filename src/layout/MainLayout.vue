<script setup lang="ts">
import { TooltipProvider } from 'reka-ui';
import Header from './Header.vue';
import AppToaster from '../components/common/AppToaster.vue';
</script>

<template>
  <TooltipProvider :delay-duration="400" :skip-delay-duration="300">
    <div
      class="min-h-screen bg-(--surface-0) text-(--text-primary) flex flex-col font-sans
             selection:bg-(--accent-subtle) selection:text-(--accent)"
    >
      <Header />

      <main class="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <slot />
      </main>
    </div>

    <AppToaster />
  </TooltipProvider>
</template>
