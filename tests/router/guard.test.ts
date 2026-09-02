import { describe, it, expect } from 'vitest';
import { resolveNavigation } from '../../src/router/guard';

const tracker = { name: 'tracker', fullPath: '/tracker', meta: { requiresAuth: true } } as const;
const catalog = { name: 'catalog', fullPath: '/', meta: {} } as const;
const login = { name: 'login', fullPath: '/login', meta: { layout: 'blank' as const } };

describe('resolveNavigation', () => {
  it('lets anyone through when Supabase is not configured', () => {
    expect(
      resolveNavigation(tracker, { supabaseConfigured: false, authStatus: 'anon' })
    ).toBe(true);
  });

  it('redirects an unauthenticated visitor away from /tracker, keeping the target', () => {
    const result = resolveNavigation(tracker, { supabaseConfigured: true, authStatus: 'anon' });
    expect(result).toEqual({ name: 'login', query: { redirect: '/tracker' } });
  });

  it('lets an authenticated user into /tracker', () => {
    expect(
      resolveNavigation(tracker, { supabaseConfigured: true, authStatus: 'authed' })
    ).toBe(true);
  });

  it('keeps the catalogue open to everyone', () => {
    expect(
      resolveNavigation(catalog, { supabaseConfigured: true, authStatus: 'anon' })
    ).toBe(true);
  });

  it('bounces an already-authenticated user off the login page', () => {
    expect(
      resolveNavigation(login, { supabaseConfigured: true, authStatus: 'authed' })
    ).toEqual({ name: 'tracker' });
  });

  it('leaves the login page reachable while signed out', () => {
    expect(
      resolveNavigation(login, { supabaseConfigured: true, authStatus: 'anon' })
    ).toBe(true);
  });
});
