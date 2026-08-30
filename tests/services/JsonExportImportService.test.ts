// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { JsonExportImportService } from '../../src/services/export/JsonExportImportService';
import type { UserProgress } from '../../src/types/progress';

describe('JsonExportImportService', () => {
  it('rejects files with invalid extensions', async () => {
    const badFile = new File(['{}'], 'test.txt', { type: 'text/plain' });
    await expect(JsonExportImportService.importProgress(badFile)).rejects.toThrow('Неверный формат файла');
  });

  it('rejects corrupted JSON content', async () => {
    const corruptedFile = new File(['{ invalid json'], 'test.json', { type: 'application/json' });
    await expect(JsonExportImportService.importProgress(corruptedFile)).rejects.toThrow();
  });

  it('rejects invalid schema structure', async () => {
    const invalidSchemaFile = new File([JSON.stringify({ someRandomField: 123 })], 'test.json', { type: 'application/json' });
    await expect(JsonExportImportService.importProgress(invalidSchemaFile)).rejects.toThrow('Ошибка валидации схемы');
  });

  it('successfully imports valid progress and sanitizes orphan keys (C3)', async () => {
    const validData: UserProgress = {
      version: '2.0.0',
      updatedAt: '2026-08-30T12:00:00Z',
      completedSkills: {
        'git-e1.1-ui-client': { completed: true, notes: 'Valid note' },
        'non-existent-orphan-skill': { completed: true, notes: 'Ghost' },
      },
    };

    const validFile = new File([JSON.stringify(validData)], 'progress.json', { type: 'application/json' });
    const result = await JsonExportImportService.importProgress(validFile);

    expect(result.data.completedSkills['git-e1.1-ui-client']).toBeDefined();
    expect(result.data.completedSkills['non-existent-orphan-skill']).toBeUndefined();
    expect(result.skippedOrphanCount).toBe(1);
  });
});
