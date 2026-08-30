import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/auth';
import { supabase } from '../../src/services/supabase/client';
import type { Session, User, AuthError } from '@supabase/supabase-js';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with anon state when no session exists', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const authStore = useAuthStore();
    await authStore.init();

    expect(authStore.status).toBe('anon');
    expect(authStore.session).toBeNull();
  });

  it('initializes with authed state when session exists', async () => {
    const fakeSession = {
      user: { id: 'user-123', email: 'test@example.com' } as unknown as User,
      access_token: 'fake-token',
    } as unknown as Session;

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: { session: fakeSession },
      error: null,
    });

    const authStore = useAuthStore();
    await authStore.init();

    expect(authStore.status).toBe('authed');
    expect(authStore.user?.email).toBe('test@example.com');
  });

  it('handles signInWithPassword success', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: { id: 'u1' } as unknown as User,
        session: {} as unknown as Session,
      },
      error: null,
    });

    const authStore = useAuthStore();
    const result = await authStore.signInWithPassword('user@example.com', 'secret');

    expect(result.ok).toBe(true);
  });

  it('handles signInWithPassword error with friendly message', async () => {
    const fakeError = { message: 'Invalid login credentials' } as unknown as AuthError;
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: fakeError,
    });

    const authStore = useAuthStore();
    const result = await authStore.signInWithPassword('wrong@example.com', 'badpass');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Неверный email или пароль');
  });

  it('handles signOut', async () => {
    vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({ error: null });

    const authStore = useAuthStore();
    await authStore.signOut();

    expect(authStore.status).toBe('anon');
    expect(authStore.session).toBeNull();
  });
});
