<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainLayout from './layout/MainLayout.vue';
import CatalogLayout from './layout/CatalogLayout.vue';

const route = useRoute();

const layout = computed(() => {
  switch (route.meta.layout) {
    case 'catalog':
      return CatalogLayout;
    case 'blank':
      return 'div';
    default:
      return MainLayout;
  }
});
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
