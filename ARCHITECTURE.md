# Архитектурный манифест: Матрица компетенций Frontend-инженера

## 1. Принципы
- **Offline-first & Cloud Sync:** Прогресс сохраняется мгновенно в локальный кэш и дебаунсится в Supabase через `SyncingStorageDriver`.
- **Слоистая архитектура (Layered Architecture):**
  `pages` $\to$ `components` $\to$ `composables` $\to$ `stores` $\to$ `services` $\to$ `config` / `utils` / `types`.
- **Строгая валидация (Schema = Source of Truth):** Все входящие данные парсятся и валидируются через схемы `zod`.
- **Изоляция утилит:** `gradeEvaluator.ts` — чистая детерминированная функция, не имеющая побочных эффектов.

---

## 2. Карта слоёв

| Слой | Назначение | Допустимые зависимости |
| :--- | :--- | :--- |
| `types/` | Zod-схемы и TypeScript контракты | — |
| `config/` | Конфигурация приложения (`app.ts`, `grades.ts`) | `types/` |
| `utils/` | Чистые функции расчёта | `types/` |
| `services/` | Драйверы хранилища (`IStorageDriver`), клиент Supabase, экспорт/импорт | `types/`, `data/` |
| `stores/` | Pinia: `matrix`, `progress`, `filter`, `auth` | `types/`, `config/`, `services/`, `utils/` |
| `composables/` | `useSkillFilter.ts` | `stores/`, `types/` |
| `components/` | Презентационные компоненты, лестница грейдов и строки навыков | `stores/`, `composables/`, `config/`, `types/` |
| `layout/` | Каркас приложения (`MainLayout.vue`, `Header.vue`) | `components/`, `stores/`, `config/` |
| `pages/` | Страницы приложения (`DashboardPage.vue`, `LoginPage.vue`) | `layout/`, `components/`, `stores/`, `config/` |

---

## 3. Вычислительный контракт (`EvaluationResult`)

```typescript
export interface EvaluationResult {
  currentGrade: Grade | 'Pre-E1.1';
  targetGrade: Grade | null;
  autoTargetGrade: Grade | null;
  isTargetManual: boolean;
  certifiedGrades: Grade[];
  gradesProgress: Record<Grade, GradeProgress>;
  gapSkills: SkillItem[];
  matrixProgressPercent: number;
  targetGradeProgressPercent: number;
  bonusSpecializations: Record<string, BonusSpecialization>;
}
```
