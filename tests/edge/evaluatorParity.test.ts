import { describe, it, expect } from 'vitest';
import { evaluateProgress as appEval } from '../../src/utils/gradeEvaluator';
import { evaluateProgress as fnEval } from '../../supabase/functions/agent-context/evaluator';
import type { SkillItem, Grade } from '../../src/types/matrix';
import matrixData from '../../src/data/matrix.json';

const skills = matrixData.skills as SkillItem[];

type Completed = Record<string, { completed: boolean; completedAt: string }>;

function complete(ids: string[]): Completed {
  return Object.fromEntries(ids.map((id) => [id, { completed: true, completedAt: '2026-08-31' }]));
}

const fixtures: { name: string; completed: Completed; target?: Grade | null }[] = [
  { name: 'empty', completed: {} },
  { name: 'all E1.1', completed: complete(skills.filter((s) => s.grade === 'E1.1').map((s) => s.id)) },
  {
    name: 'all E1.x + manual target E3.1',
    completed: complete(skills.filter((s) => s.grade.startsWith('E1')).map((s) => s.id)),
    target: 'E3.1',
  },
  { name: 'everything', completed: complete(skills.map((s) => s.id)) },
];

/** Compare the fields both implementations produce identically. */
function comparable(r: ReturnType<typeof appEval> | ReturnType<typeof fnEval>) {
  return {
    currentGrade: r.currentGrade,
    targetGrade: r.targetGrade,
    autoTargetGrade: r.autoTargetGrade,
    isTargetManual: r.isTargetManual,
    certifiedGrades: r.certifiedGrades,
    gradesProgress: r.gradesProgress,
    bonusSpecializations: r.bonusSpecializations,
    matrixProgressPercent: r.matrixProgressPercent,
    targetGradeProgressPercent: r.targetGradeProgressPercent,
    gapSkillIds: r.gapSkills.map((s) => s.id),
  };
}

describe('Edge Function evaluator parity', () => {
  for (const f of fixtures) {
    it(`matches the app evaluator: ${f.name}`, () => {
      const app = comparable(appEval(skills, f.completed, f.target ?? null));
      const fn = comparable(fnEval(skills, f.completed, f.target ?? null));
      expect(fn).toEqual(app);
    });
  }
});
