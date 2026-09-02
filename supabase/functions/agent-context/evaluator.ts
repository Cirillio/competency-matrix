// Standalone copy of src/utils/gradeEvaluator.ts for the Deno Edge Function
// (Deno needs no zod / type imports here). Kept in sync by
// tests/edge/evaluatorParity.test.ts, which runs both implementations against
// the real dataset and several fixtures and fails on any divergence.

export const ORDERED_GRADES = [
  'E1.1', 'E1.2', 'E2.1', 'E2.2', 'E3.1', 'E3.2', 'E4.1', 'E4.2', 'E5.1', 'E5.2',
] as const;
export type Grade = (typeof ORDERED_GRADES)[number];

export interface EvalSkill {
  id: string;
  competencyId: string;
  competencyName: string;
  grade: Grade;
  requirement: 'mandatory' | 'desirable' | 'additional' | 'optional';
  title: string;
  topics: string[];
}

export interface GradeProgress {
  grade: Grade;
  isCertified: boolean;
  mandatoryCoverage: number;
  desirableCoverage: number;
  totalMandatory: number;
  completedMandatory: number;
  totalDesirable: number;
  completedDesirable: number;
  totalBonus: number;
  completedBonus: number;
}

export interface BonusSpecialization {
  competencyId: string;
  competencyName: string;
  totalBonusSkills: number;
  completedBonusSkills: number;
  percent: number;
}

export interface EvaluationResult {
  currentGrade: Grade | 'Pre-E1.1';
  targetGrade: Grade | null;
  autoTargetGrade: Grade | null;
  isTargetManual: boolean;
  certifiedGrades: Grade[];
  gradesProgress: Record<Grade, GradeProgress>;
  gapSkills: EvalSkill[];
  matrixProgressPercent: number;
  targetGradeProgressPercent: number;
  bonusSpecializations: Record<string, BonusSpecialization>;
}

export function evaluateProgress(
  skills: EvalSkill[],
  completedSkills: Record<string, { completedAt?: string; completed?: boolean }>,
  manualTargetGrade?: Grade | null
): EvaluationResult {
  const completedIds = new Set<string>();
  for (const [id, record] of Object.entries(completedSkills)) {
    if (record) {
      if (
        record.completed === true ||
        (record.completed === undefined && 'completedAt' in record && Boolean(record.completedAt))
      ) {
        completedIds.add(id);
      }
    }
  }

  const gradesProgress = {} as Record<Grade, GradeProgress>;

  for (const grade of ORDERED_GRADES) {
    const gradeSkills = skills.filter((s) => s.grade === grade);
    const mandatorySkills = gradeSkills.filter((s) => s.requirement === 'mandatory');
    const desirableSkills = gradeSkills.filter((s) => s.requirement === 'desirable');
    const bonusSkills = gradeSkills.filter(
      (s) => s.requirement === 'additional' || s.requirement === 'optional'
    );

    const completedMandatory = mandatorySkills.filter((s) => completedIds.has(s.id)).length;
    const completedDesirable = desirableSkills.filter((s) => completedIds.has(s.id)).length;
    const completedBonus = bonusSkills.filter((s) => completedIds.has(s.id)).length;

    const mandatoryCoverage =
      mandatorySkills.length === 0 ? 1.0 : completedMandatory / mandatorySkills.length;
    const desirableCoverage =
      desirableSkills.length === 0 ? 1.0 : completedDesirable / desirableSkills.length;

    const isMandatorySatisfied =
      mandatorySkills.length === 0 || completedMandatory === mandatorySkills.length;
    const isDesirableSatisfied =
      desirableSkills.length === 0 || completedDesirable * 10 >= desirableSkills.length * 7;

    gradesProgress[grade] = {
      grade,
      isCertified: isMandatorySatisfied && isDesirableSatisfied,
      mandatoryCoverage,
      desirableCoverage,
      totalMandatory: mandatorySkills.length,
      completedMandatory,
      totalDesirable: desirableSkills.length,
      completedDesirable,
      totalBonus: bonusSkills.length,
      completedBonus,
    };
  }

  const certifiedGrades: Grade[] = [];
  let currentGrade: Grade | 'Pre-E1.1' = 'Pre-E1.1';
  let autoTargetGrade: Grade | null = ORDERED_GRADES[0];

  for (let i = 0; i < ORDERED_GRADES.length; i++) {
    const grade = ORDERED_GRADES[i];
    if (gradesProgress[grade].isCertified) {
      certifiedGrades.push(grade);
      currentGrade = grade;
      autoTargetGrade = i + 1 < ORDERED_GRADES.length ? ORDERED_GRADES[i + 1] : null;
    } else {
      autoTargetGrade = grade;
      break;
    }
  }

  let targetGrade: Grade | null = autoTargetGrade;
  let isTargetManual = false;
  if (manualTargetGrade) {
    const manualIndex = ORDERED_GRADES.indexOf(manualTargetGrade);
    const currentIndex = currentGrade === 'Pre-E1.1' ? -1 : ORDERED_GRADES.indexOf(currentGrade);
    if (manualIndex > currentIndex) {
      targetGrade = manualTargetGrade;
      isTargetManual = true;
    }
  }

  const gapSkills: EvalSkill[] = [];
  if (targetGrade !== null) {
    const targetIndex = ORDERED_GRADES.indexOf(targetGrade);
    const relevantGradesSet = new Set(ORDERED_GRADES.slice(0, targetIndex + 1));
    for (const skill of skills) {
      if (
        relevantGradesSet.has(skill.grade) &&
        skill.requirement === 'mandatory' &&
        !completedIds.has(skill.id)
      ) {
        gapSkills.push(skill);
      }
    }
  }

  const totalSkillsCount = skills.length;
  const totalCompletedCount = skills.filter((s) => completedIds.has(s.id)).length;
  const matrixProgressPercent =
    totalSkillsCount === 0 ? 0 : Math.round((totalCompletedCount / totalSkillsCount) * 100);

  let targetGradeProgressPercent = 100;
  if (targetGrade !== null) {
    const tp = gradesProgress[targetGrade];
    const covD = Math.min(1.0, tp.desirableCoverage / 0.7);
    targetGradeProgressPercent = Math.round(((tp.mandatoryCoverage + covD) / 2) * 100);
  }

  const bonusSpecializations: Record<string, BonusSpecialization> = {};
  const bonusSkills = skills.filter(
    (s) => s.requirement === 'additional' || s.requirement === 'optional'
  );
  for (const skill of bonusSkills) {
    if (!bonusSpecializations[skill.competencyId]) {
      bonusSpecializations[skill.competencyId] = {
        competencyId: skill.competencyId,
        competencyName: skill.competencyName,
        totalBonusSkills: 0,
        completedBonusSkills: 0,
        percent: 0,
      };
    }
    const spec = bonusSpecializations[skill.competencyId];
    spec.totalBonusSkills += 1;
    if (completedIds.has(skill.id)) spec.completedBonusSkills += 1;
  }
  for (const compId in bonusSpecializations) {
    const spec = bonusSpecializations[compId];
    spec.percent =
      spec.totalBonusSkills === 0
        ? 0
        : Math.round((spec.completedBonusSkills / spec.totalBonusSkills) * 100);
  }

  return {
    currentGrade,
    targetGrade,
    autoTargetGrade,
    isTargetManual,
    certifiedGrades,
    gradesProgress,
    gapSkills,
    matrixProgressPercent,
    targetGradeProgressPercent,
    bonusSpecializations,
  };
}
