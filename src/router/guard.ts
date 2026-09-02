import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import type { AuthStatus } from '../stores/auth';

export interface GuardContext {
  supabaseConfigured: boolean;
  authStatus: AuthStatus;
}

/**
 * Pure navigation decision. `true` = allow; an object = redirect.
 * Kept separate from the router so it can be unit-tested without a real
 * Supabase client or a mounted app.
 */
export function resolveNavigation(
  to: Pick<RouteLocationNormalized, 'name' | 'fullPath' | 'meta'>,
  ctx: GuardContext
): true | RouteLocationRaw {
  // Local-only mode: no auth wall at all.
  if (!ctx.supabaseConfigured) return true;

  if (to.meta.requiresAuth && ctx.authStatus !== 'authed') {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.name === 'login' && ctx.authStatus === 'authed') {
    return { name: 'tracker' };
  }

  return true;
}
