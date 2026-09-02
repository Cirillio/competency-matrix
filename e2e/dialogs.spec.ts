import { test, expect } from '@playwright/test';

async function openMenuItem(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Меню действий' }).click();
  await page.getByRole('menuitem', { name }).click();
}

test.describe('header dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tracker');
    await expect(page.getByText('Сейчас', { exact: true })).toBeVisible();
  });

  test('matrices dialog: list, empty state, format spec, import validation', async ({ page }) => {
    await openMenuItem(page, 'Матрицы');
    const dialog = page.getByRole('dialog');

    // list tab: built-in matrix is always present + a friendly empty state
    await expect(dialog.getByRole('button', { name: /встроенная/i })).toBeVisible();
    await expect(dialog.getByText('Своих матриц пока нет')).toBeVisible();

    // -> Добавить (both the empty-state CTA and the tab reach it)
    await dialog.getByRole('button', { name: 'Загрузить матрицу' }).click();
    await expect(dialog.getByText('Формат файла')).toBeVisible();
    await dialog.getByRole('tab', { name: 'Список' }).click();
    await expect(dialog.getByRole('button', { name: /встроенная/i })).toBeVisible();
    await dialog.getByRole('tab', { name: 'Добавить' }).click();
    await expect(dialog.getByText('Формат файла')).toBeVisible();
    await expect(dialog.getByText('skills[].requirement')).toBeVisible();
    await expect(dialog.getByText('"mandatory" | "desirable" | "additional" | "optional"')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Скачать шаблон' })).toBeVisible();

    const json = dialog.locator('#pack-json');
    const addBtn = dialog.getByRole('button', { name: 'Добавить матрицу' });

    await json.fill('{ not json');
    await expect(dialog.getByText('не похоже на JSON', { exact: false })).toBeVisible();
    await expect(addBtn).toBeDisabled();

    // id that collides with a built-in skill
    await json.fill(
      JSON.stringify({
        name: 'X',
        version: '1.0.0',
        skills: [
          {
            id: 'git-e1.1-ui-client',
            competencyId: 'x',
            competencyName: 'X',
            category: 'Тех. скилы',
            section: 'S',
            grade: 'E1.1',
            requirement: 'mandatory',
            title: 'dup',
            description: '',
            topics: [],
            links: [],
          },
        ],
      })
    );
    await expect(dialog.getByText('уже есть в матрице', { exact: false })).toBeVisible();
    await expect(addBtn).toBeDisabled();

    // valid, new
    await json.fill(
      JSON.stringify({
        name: 'Проверочный набор',
        version: '2.0.0',
        skills: [
          {
            id: 'be-node-1',
            competencyId: 'node',
            competencyName: 'Node.js',
            category: 'Тех. скилы',
            section: 'Серверные технологии',
            grade: 'E2.1',
            requirement: 'mandatory',
            title: 'Event loop в Node',
            description: 'x',
            topics: ['libuv'],
            links: [],
          },
        ],
      })
    );
    await expect(dialog.getByText('Проверочный набор', { exact: false })).toBeVisible();
    await expect(addBtn).toBeEnabled();
  });

  test('AI context: profile flows into the prompt', async ({ page }) => {
    await page.getByRole('button', { name: 'Открыть контекст для ИИ' }).click();
    const dialog = page.getByRole('dialog');
    const pre = dialog.locator('pre');

    await expect(pre).toContainText('спроси об опыте'); // empty-profile instruction
    await dialog.locator('#ai-profile').fill('Стажировка пройдена, React и Angular в проде.');
    await expect(pre).toContainText('React и Angular в проде');
    await expect(pre).not.toContainText('спроси об опыте');
    await expect(pre).toContainText("typeof null === 'object'"); // trivia ban present
  });

  test('AI agent access: token dialog renders with the public endpoint hint', async ({ page }) => {
    await openMenuItem(page, 'Доступ для ИИ-агентов');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Доступ для ИИ-агентов')).toBeVisible();
    await expect(dialog.locator('#token-name')).toBeVisible();
    await expect(dialog.getByText('agent-context/matrix', { exact: false })).toBeVisible();
  });

  test('reset progress asks for confirmation', async ({ page }) => {
    await openMenuItem(page, 'Сбросить прогресс');
    await expect(page.getByRole('alertdialog').getByText('Сбросить весь прогресс?')).toBeVisible();
    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});
