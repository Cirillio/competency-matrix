import type { UserProgress } from '../../types/progress';
import { userProgressSchema, PROGRESS_SCHEMA_VERSION } from '../../types/progress';
import matrixRawData from '../../data/matrix.json';

export interface ImportResult {
  data: UserProgress;
  skippedOrphanCount: number;
}

export class JsonExportImportService {
  /**
   * Triggers a browser download of the user progress JSON file.
   */
  static exportProgress(data: UserProgress, filename = 'matrix-progress.json'): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reads, parses and validates a JSON file uploaded by the user with Zod schema.
   * Sanitizes orphan keys that do not exist in the current matrix dataset.
   */
  static importProgress(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        return reject(new Error('Неверный формат файла. Требуется .json файл'));
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          return reject(new Error('Ошибка чтения JSON файла: поврежденный синтаксис'));
        }

        const validation = userProgressSchema.safeParse(parsed);
        if (!validation.success) {
          const firstError = validation.error?.issues?.[0]?.message || 'Некорректная структура файла';
          return reject(new Error(`Ошибка валидации схемы прогресса: ${firstError}`));
        }

        // Filter out orphan keys that do not exist in matrix.json
        const validSkillIds = new Set(matrixRawData.skills.map((s) => s.id));
        const cleanCompletedSkills: UserProgress['completedSkills'] = {};
        let skippedOrphanCount = 0;

        for (const [id, record] of Object.entries(validation.data.completedSkills)) {
          if (validSkillIds.has(id)) {
            cleanCompletedSkills[id] = record;
          } else {
            skippedOrphanCount++;
          }
        }

        const sanitizedProgress: UserProgress = {
          version: validation.data.version || PROGRESS_SCHEMA_VERSION,
          updatedAt: validation.data.updatedAt,
          completedSkills: cleanCompletedSkills,
        };

        resolve({
          data: sanitizedProgress,
          skippedOrphanCount,
        });
      };

      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }
}
