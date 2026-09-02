import { test, expect } from '@playwright/test';

test.describe('public catalogue (/)', () => {
  test('renders the catalogue without a login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Что должен знать фронтенд-инженер' })).toBeVisible();
    await expect(page.getByText('139 навыков', { exact: false })).toBeVisible();
    // no progress affordances on the catalogue
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('a competency section expands to its skills and a skill opens a dialog', async ({ page }) => {
    await page.goto('/');
    const git = page.getByRole('button', { name: /^Git/ });
    await git.click();
    const skill = page.getByRole('button', { name: 'Использование UI-клиентов Git' });
    await expect(skill).toBeVisible();
    await skill.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Использование UI-клиентов Git')).toBeVisible();
    await expect(dialog.getByText('E1.1')).toBeVisible();
  });

  test('search narrows the catalogue', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Поиск по навыкам').fill('rebase');
    await expect(page.getByRole('button', { name: /Git/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^React/ })).toHaveCount(0);
  });

  test('the level filter is cumulative', async ({ page }) => {
    await page.goto('/');
    // "Уровень" select -> E1.1 then E1.2; E1.2 must still surface E1.1 skills
    const levelSelect = page.getByRole('combobox', { name: 'Уровень' });
    await levelSelect.click();
    await page.getByRole('option', { name: 'E1.1' }).click();
    await page.getByRole('button', { name: /^Git/ }).click();
    await expect(page.getByRole('button', { name: 'Базовые команды Git CLI' })).toHaveCount(0);

    await levelSelect.click();
    await page.getByRole('option', { name: 'E1.2' }).click();
    await page.getByRole('button', { name: /^Git/ }).click();
    await expect(page.getByRole('button', { name: 'Использование UI-клиентов Git' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Базовые команды Git CLI' })).toBeVisible();
  });

  test('"Открыть трекер" navigates to /tracker', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Открыть трекер' }).first().click();
    await expect(page).toHaveURL(/\/tracker$/);
  });
});
