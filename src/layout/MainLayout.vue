<script setup lang="ts">
import Header from './Header.vue';
</script>

<template>
  <div class="min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-subtle)] selection:text-[var(--accent)]">
    <!-- Top Header -->
    <Header />

    <!-- Main Content Container -->
    <main class="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-6">
      <slot />
    </main>
  </div>
</template>
