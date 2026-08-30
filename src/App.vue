<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { isSupabaseConfigured } from './services/supabase/client';
import MainLayout from './layout/MainLayout.vue';
import DashboardPage from './pages/DashboardPage.vue';
import LoginPage from './pages/LoginPage.vue';
import { Loader2 } from 'lucide-vue-next';

const authStore = useAuthStore();

onMounted(async () => {
  if (isSupabaseConfigured) {
    await authStore.init();
  } else {
    authStore.status = 'authed';
  }
});
</script>

<template>
  <!-- Loading state -->
  <div
    v-if="isSupabaseConfigured && authStore.status === 'loading'"
    class="min-h-screen bg-[var(--surface-0)] flex items-center justify-center text-[var(--text-tertiary)]"
  >
    <div class="flex flex-col items-center gap-3">
      <Loader2 class="w-6 h-6 animate-spin text-[var(--accent)]" />
      <span class="text-xs font-mono">Загрузка сессии...</span>
    </div>
  </div>

  <!-- Unauthenticated Gate -->
  <LoginPage v-else-if="isSupabaseConfigured && authStore.status !== 'authed'" />

  <!-- Authenticated Application -->
  <MainLayout v-else>
    <DashboardPage />
  </MainLayout>
</template>
