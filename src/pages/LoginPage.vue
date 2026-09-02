<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';
import { useAuthStore } from '../stores/auth';
import { APP_NAME } from '../config/app';
import { PhSpinnerGap } from '@phosphor-icons/vue';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const emailInputRef = useTemplateRef<HTMLInputElement>('emailInputRef');

onMounted(() => {
  emailInputRef.value?.focus();
});

async function handleSubmit() {
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Заполните email и пароль';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await authStore.signInWithPassword(email.value.trim(), password.value);
    if (!result.ok) {
      errorMessage.value = result.error || 'Ошибка входа';
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Ошибка подключения';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--surface-0)] flex items-center justify-center p-4">
    <div class="w-full max-w-[380px] bg-[var(--surface-1)] rounded-2xl p-8 space-y-6">
      <!-- Wordmark Header -->
      <div class="space-y-1.5 text-center">
        <h1 class="text-lg font-bold tracking-tight text-[var(--text-primary)] font-mono">
          {{ APP_NAME }}
        </h1>
        <p class="text-xs text-[var(--text-tertiary)]">
          Войдите, чтобы прогресс сохранялся на всех устройствах
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Field -->
        <div class="space-y-1.5 text-left">
          <label for="login-email" class="block text-[11px] font-mono text-[var(--text-secondary)]">
            Email
          </label>
          <input
            id="login-email"
            ref="emailInputRef"
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="name@example.com"
            class="w-full bg-[var(--surface-2)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <!-- Password Field -->
        <div class="space-y-1.5 text-left">
          <label for="login-password" class="block text-[11px] font-mono text-[var(--text-secondary)]">
            Пароль
          </label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-[var(--surface-2)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <!-- Error message (aria-live polite) -->
        <div
          v-if="errorMessage"
          aria-live="polite"
          class="text-xs text-[var(--critical)] bg-[var(--critical-subtle)] px-3 py-2 rounded-lg text-center font-medium"
        >
          {{ errorMessage }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2 px-4 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold tracking-wide transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <PhSpinnerGap v-if="isLoading" :size="16" class="animate-spin" />
          <span>{{ isLoading ? 'Проверка...' : 'Войти' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
