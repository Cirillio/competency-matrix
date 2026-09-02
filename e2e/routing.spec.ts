import { test, expect } from '@playwright/test';

test.describe('routing', () => {
  test('unknown path redirects to the catalogue', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Матрицы компетенций по направлениям' })).toBeVisible();
  });

  test('the login route renders its form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('the header wordmark returns to the catalogue from the tracker', async ({ page }) => {
    await page.goto('/tracker');
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Матрица/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Матрицы компетенций по направлениям' })).toBeVisible();
  });

  test('deep links survive a reload', async ({ page }) => {
    await page.goto('/tracker');
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/tracker$/);
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
  });
});
