import { test, expect, type Page } from '@playwright/test';

async function openTracker(page: Page) {
  // One-shot clear — addInitScript would re-run on every reload and wipe the
  // state a persistence test is trying to verify.
  await page.goto('/tracker');
  await page.evaluate(() => window.localStorage.removeItem('matrix_progress_v2'));
  await page.reload();
  await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
}

async function openGitSection(page: Page) {
  await page.getByRole('button', { name: /^Git/ }).first().click();
  await page
    .getByRole('checkbox', { name: 'Отметить навык: Использование UI-клиентов Git' })
    .waitFor({ state: 'visible' });
}

test.describe('tracker (/tracker)', () => {
  test.beforeEach(({ page }) => openTracker(page));

  test('marking a skill persists across a reload', async ({ page }) => {
    await openGitSection(page);
    const cb = page.getByRole('checkbox', { name: 'Отметить навык: Использование UI-клиентов Git' });
    await cb.check();
    await expect(cb).toHaveAttribute('aria-checked', 'true');

    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('matrix_progress_v2') || '{}')
    );
    expect(stored.completedSkills['git-e1.1-ui-client']?.completed).toBe(true);

    await page.reload();
    await openGitSection(page);
    await expect(
      page.getByRole('checkbox', { name: 'Отметить навык: Использование UI-клиентов Git' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('the levels dialog opens from the explicit control; a manual target widens the gap list', async ({ page }) => {
    const gapCounter = page.getByRole('button', { name: 'Что мешает перейти дальше' });
    const gapBefore = Number((await gapCounter.innerText()).replace(/\D+/g, ''));

    await page.getByRole('button', { name: /Уровни и цель/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: /Middle 2/ }).click();
    await expect(dialog.getByText('Сбросить свой выбор')).toBeVisible();
    await page.keyboard.press('Escape');

    const gapAfter = Number((await gapCounter.innerText()).replace(/\D+/g, ''));
    expect(gapAfter).toBeGreaterThan(gapBefore);
  });

  test('the gap popover jumps into the matrix with the "Пробелы" filter on', async ({ page }) => {
    await page.getByRole('button', { name: 'Что мешает перейти дальше' }).click();
    const jump = page.getByRole('button', { name: 'Показать в списке' });
    await expect(jump).toBeVisible();
    await jump.click();
    await expect(page.getByRole('button', { name: 'Пробелы' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('quick filters toggle their pressed state', async ({ page }) => {
    const uncompleted = page.getByRole('button', { name: 'Незакрытые' });
    await uncompleted.click();
    await expect(uncompleted).toHaveAttribute('aria-pressed', 'true');
    await uncompleted.click();
    await expect(uncompleted).toHaveAttribute('aria-pressed', 'false');
  });

  test('mobile: filters live in a bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.reload();
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Фильтры' }).click();
    await expect(page.getByRole('dialog').getByText('Уровень')).toBeVisible();
  });
});
