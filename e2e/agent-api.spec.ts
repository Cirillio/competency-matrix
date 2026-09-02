import { test, expect } from '@playwright/test';

// Hits the live Edge Function (read-only, public paths).
const BASE = 'https://xxoedworntkuotafqlih.supabase.co/functions/v1/agent-context';

test.describe('agent-context Edge Function', () => {
  test('GET /matrix is public and returns the full matrix', async ({ request }) => {
    const res = await request.get(`${BASE}/matrix`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills.length).toBe(139);
    expect(body.skills[0]).toHaveProperty('grade');
    expect(body.skills[0]).toHaveProperty('title');
  });

  test('GET / without a token is 401 missing_token', async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe('missing_token');
  });

  test('GET / with an unknown token is 401 invalid_token', async ({ request }) => {
    const res = await request.get(`${BASE}/`, {
      headers: { Authorization: 'Bearer cmx_definitely_not_a_real_token' },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe('invalid_token');
  });

  test('CORS preflight is allowed', async ({ request }) => {
    const res = await request.fetch(`${BASE}/`, { method: 'OPTIONS' });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });
});
