import { test, expect } from '@playwright/test';

/**
 * Real Supabase auth flows. Skipped unless E2E_EMAIL / E2E_PASSWORD are set
 * AND the dev server is started with real VITE_SUPABASE_* vars (see README).
 * With those, run:  E2E_EMAIL=… E2E_PASSWORD=… npx playwright test authed
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe('authenticated flows', () => {
  test.skip(!EMAIL || !PASSWORD, 'set E2E_EMAIL / E2E_PASSWORD (and real Supabase env) to run');

  test('/tracker redirects to /login when signed out, and back after signing in', async ({ page }) => {
    await page.goto('/tracker');
    await expect(page).toHaveURL(/\/login\?redirect=%2Ftracker|\/login\?redirect=\/tracker/);

    await page.getByLabel('Email').fill(EMAIL!);
    await page.getByLabel('Пароль').fill(PASSWORD!);
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/tracker$/);
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
  });

  test('a created API token authenticates against the Edge Function', async ({ page, request }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL!);
    await page.getByLabel('Пароль').fill(PASSWORD!);
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL(/\/tracker$/);

    await page.getByRole('button', { name: 'Меню действий' }).click();
    await page.getByRole('menuitem', { name: 'Доступ для ИИ-агентов' }).click();
    await page.locator('#token-name').fill('e2e');
    await page.getByRole('button', { name: 'Создать' }).click();

    const token = await page.locator('code', { hasText: /^cmx_/ }).first().innerText();
    expect(token).toMatch(/^cmx_[0-9a-f]{48}$/);

    const res = await request.get(
      'https://xxoedworntkuotafqlih.supabase.co/functions/v1/agent-context/',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('level');
    expect(body).toHaveProperty('completedSkillIds');
    expect(body.skillCount).toBeGreaterThanOrEqual(139);
  });
});
