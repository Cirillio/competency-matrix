import type { Grade, SkillItem } from '../types/matrix';
import type { EvaluationResult } from '../types/evaluation';
import { GRADE_DETAILS } from '../config/grades';

export interface AiContextInput {
  evaluation: EvaluationResult;
  /** Free-text background: experience, stack, immediate goal. */
  profile?: string;
  /** Cap on how many blockers are listed, so the prompt stays usable. */
  maxGapSkills?: number;
}

function gradeLabel(grade: Grade | 'Pre-E1.1'): string {
  const meta = GRADE_DETAILS[grade];
  return meta ? `${meta.label} (${grade})` : grade;
}

function formatGapSkills(skills: SkillItem[], limit: number): string {
  if (skills.length === 0) {
    return 'Обязательные навыки до целевого грейда закрыты полностью.';
  }

  const lines = skills
    .slice(0, limit)
    .map((s) => `- [${s.grade}] ${s.competencyName} — ${s.title}: ${s.topics.join(', ')}`);

  if (skills.length > limit) {
    lines.push(`- …и ещё ${skills.length - limit} обязательных навыков того же уровня`);
  }
  return lines.join('\n');
}

/** Competencies where at least one skill is closed — tells the model what NOT to re-ask. */
function formatStrengths(evaluation: EvaluationResult): string {
  const certified = evaluation.certifiedGrades;
  const parts: string[] = [];

  if (certified.length > 0) {
    parts.push(`Подтверждённые грейды: ${certified.map(gradeLabel).join(', ')}.`);
  }

  const specialisations = Object.values(evaluation.bonusSpecializations)
    .filter((s) => s.completedBonusSkills > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6)
    .map((s) => `${s.competencyName} (${s.completedBonusSkills}/${s.totalBonusSkills})`);

  if (specialisations.length > 0) {
    parts.push(`Дополнительные навыки закрыты по: ${specialisations.join(', ')}.`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Отметок пока нет — считай данные о закрытом неполными.';
}

/**
 * Builds the markdown prompt handed to an external LLM for a mock interview.
 *
 * The rules block exists because an unconstrained model defaults to interview
 * folklore — language history, REPL parsing quirks, spec recitation — none of
 * which predicts whether someone writes working code.
 */
export function buildAiContext(input: AiContextInput): string {
  const { evaluation, profile, maxGapSkills = 25 } = input;

  const target = evaluation.targetGrade;
  const targetLine = target
    ? `${gradeLabel(target)}${evaluation.isTargetManual ? ' — выбран вручную' : ''}`
    : 'достигнут максимум шкалы';

  const profileBlock = profile?.trim()
    ? profile.trim()
    : 'Не заполнен. Прежде чем задавать вопросы, спроси об опыте, стеке и ближайшей цели — ' +
      'без этого калибровка уровня будет неверной.';

  return `# Контекст: подготовка фронтенд-инженера

## Профиль
${profileBlock}

## Положение на матрице
- Текущий подтверждённый уровень: ${gradeLabel(evaluation.currentGrade)}
- Целевой уровень: ${targetLine}
- Прогресс до цели: ${evaluation.targetGradeProgressPercent}%
- Охват всей матрицы: ${evaluation.matrixProgressPercent}%

${formatStrengths(evaluation)}

Важно: матрица отражает только проставленные отметки. Незакрытый навык означает
«не подтверждён владельцем», а не «человек этого не знает». Если ответ показывает,
что тема на деле освоена — скажи об этом прямо и иди дальше, не добивай вопросами.

## Незакрытые обязательные навыки до цели
${formatGapSkills(evaluation.gapSkills, maxGapSkills)}

## Роль и формат
Ты — практикующий фронтенд-инженер, проводишь техническое интервью на уровень
${target ? gradeLabel(target) : gradeLabel(evaluation.currentGrade)}. Держи этот уровень: не проваливайся
ни в олимпиадные задачи, ни в senior-темы (архитектура платформ, тонкости компиляторов).

Правила:

1. Один вопрос за раз. Дождись ответа. Не выкладывай следующий вопрос вместе с разбором предыдущего.
2. Спрашивай только то, незнание чего приводит к реальному багу, утечке или нечитаемому коду.
   Проверяй каждый вопрос: «что сломается в продакшене, если человек этого не знает?»
   Внятного ответа нет — вопрос не задавай.
3. Не спрашивай:
   - историю языка и движков (почему \`typeof null === 'object'\`, что решил Эйх в 1995);
   - поведение, зависящее от парсера или консоли (\`{} + []\` в REPL, ловушки ASI);
   - воспроизведение спецификации по памяти (перечисли все методы массива, назови шаги ToPrimitive);
   - головоломки на порядок вывода ради головоломок.
4. Вместо этого давай короткий фрагмент кода, похожий на рабочий, и спрашивай:
   «что здесь сломается и почему», «почему UI не обновится», «где здесь утечка».
   Привязывай к стеку, на котором человек уже писал.
5. Разбор ответа — не длиннее двух абзацев. Сначала цена ошибки на практике, затем механизм.
   Никаких лекций на несколько экранов и пересказа спецификации.
6. Ответ поверхностный — не переходи дальше и не вываливай полный разбор.
   Задай один наводящий вопрос, дай попытку исправиться.
7. Не хвали без причины и не смягчай. Слабый ответ называй слабым и объясняй, чего конкретно не хватает.
8. Каждые 5 вопросов давай короткую сводку: что подтверждено, что провисает, что учить в первую очередь.

Начни с одного вопроса по самой значимой теме из списка выше.`;
}
