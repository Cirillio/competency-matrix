/**
 * Plain-language wording for load-bearing terms, kept in one place so every
 * screen says the same thing. Technical markers (E1.2, "грейд") are not removed —
 * each screen pairs them with a human label instead.
 */
export const COPY = {
  /** was «Охват матрицы» */
  coverageLabel: 'Пройдено',
  /** short, was «Блокеры» */
  gapLabel: 'Осталось закрыть',
  /** full sentence for headings/tooltips */
  gapLong: 'Что мешает перейти дальше',
  targetLabel: 'Цель',
  /** was «Специализации (Overachievement)» */
  bonusLabel: 'Дополнительные навыки',
  /** the explicit control that opens the levels dialog */
  levelsAction: 'Уровни и цель',
  levelsHint: 'Посмотреть все уровни и выбрать, к какому готовитесь',
} as const;
