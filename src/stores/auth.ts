import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { useProgressStore } from './progress';
import { LocalStorageDriver } from '../services/storage/LocalStorageDriver';

export type AuthStatus = 'loading' | 'authed' | 'anon';

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const user = ref<User | null>(null);
  const status = ref<AuthStatus>('loading');
  let isInitialized = false;

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    try {
      const { data } = await supabase.auth.getSession();
      session.value = data.session;
      user.value = data.session?.user ?? null;
      status.value = data.session ? 'authed' : 'anon';

      // Restore progress on boot when a persisted session already exists.
      // onAuthStateChange only fires INITIAL_SESSION here (not SIGNED_IN), so
      // the listener below would not load anything on a plain page reload.
      if (data.session) {
        await useProgressStore().loadProgress();
      }
    } catch {
      status.value = 'anon';
    }

    supabase.auth.onAuthStateChange(async (event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;

      if (event === 'SIGNED_IN' || (newSession && status.value !== 'authed')) {
        status.value = 'authed';
        const progressStore = useProgressStore();
        await progressStore.loadProgress();
      } else if (event === 'SIGNED_OUT' || !newSession) {
        status.value = 'anon';
        const progressStore = useProgressStore();
        // Safe local-only cache wipe (never triggers remote.clear() on logout)
        progressStore.resetLocalState();
        const localDriver = new LocalStorageDriver();
        await localDriver.clear();
      }
    });
  }

  async function signInWithPassword(email: string, password: string): Promise<AuthActionResult> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid_grant')) {
          return { ok: false, error: 'Неверный email или пароль' };
        }
        if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
          return { ok: false, error: 'Нет соединения с сервером' };
        }
        return { ok: false, error: 'Ошибка входа. Проверьте введенные данные' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Ошибка сети. Попробуйте позже' };
    }
  }

  async function signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signOut error:', err);
    } finally {
      status.value = 'anon';
      session.value = null;
      user.value = null;
    }
  }

  return {
    session,
    user,
    status,
    init,
    signInWithPassword,
    signOut,
  };
});
