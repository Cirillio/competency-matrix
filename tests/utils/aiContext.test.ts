import { describe, it, expect } from 'vitest';
import { buildAiContext } from '../../src/utils/aiContext';
import { evaluateProgress } from '../../src/utils/gradeEvaluator';
import type { SkillItem } from '../../src/types/matrix';
import matrixData from '../../src/data/matrix.json';

const allSkills = matrixData.skills as SkillItem[];
const emptyEvaluation = evaluateProgress(allSkills, {});

describe('buildAiContext', () => {
  it('states the human-readable level, not just the code', () => {
    const prompt = buildAiContext({ evaluation: emptyEvaluation });

    expect(prompt).toContain('Старт (Pre-E1.1)');
    expect(prompt).toContain('Junior 1 (E1.1)');
  });

  it('includes the profile verbatim when provided', () => {
    const profile = 'Стажировка пройдена, React и Angular в проде, жду оффер на джуна.';
    const prompt = buildAiContext({ evaluation: emptyEvaluation, profile });

    expect(prompt).toContain(profile);
  });

  it('tells the model to ask for background when the profile is empty', () => {
    const prompt = buildAiContext({ evaluation: emptyEvaluation, profile: '   ' });

    expect(prompt).toContain('спроси об опыте');
  });

  it('bans interview trivia explicitly', () => {
    const prompt = buildAiContext({ evaluation: emptyEvaluation });

    expect(prompt).toContain("typeof null === 'object'");
    expect(prompt).toContain('Не спрашивай');
    expect(prompt).toContain('ToPrimitive');
    expect(prompt).toContain('Один вопрос за раз');
  });

  it('warns that unticked skills are not proof of ignorance', () => {
    const prompt = buildAiContext({ evaluation: emptyEvaluation });

    expect(prompt).toContain('не подтверждён владельцем');
  });

  it('caps the blocker list and reports the remainder', () => {
    const prompt = buildAiContext({ evaluation: emptyEvaluation, maxGapSkills: 3 });

    const listed = prompt.split('\n').filter((l) => /^- \[E\d\.\d]/.test(l));
    expect(listed).toHaveLength(3);
    expect(prompt).toMatch(/и ещё \d+ обязательных навыков/);
  });

  it('reports a fully closed path instead of an empty list', () => {
    const completed = Object.fromEntries(
      allSkills.map((s) => [s.id, { completed: true, completedAt: '2026-08-31' }])
    );
    const evaluation = evaluateProgress(allSkills, completed);
    const prompt = buildAiContext({ evaluation });

    expect(prompt).toContain('закрыты полностью');
    expect(prompt).toContain('достигнут максимум шкалы');
  });

  it('lists certified grades so the model does not re-test them', () => {
    const e11 = allSkills.filter((s) => s.grade === 'E1.1');
    const completed = Object.fromEntries(
      e11.map((s) => [s.id, { completed: true, completedAt: '2026-08-31' }])
    );
    const evaluation = evaluateProgress(allSkills, completed);
    const prompt = buildAiContext({ evaluation });

    expect(prompt).toContain('Подтверждённые грейды: Junior 1 (E1.1)');
  });
});
