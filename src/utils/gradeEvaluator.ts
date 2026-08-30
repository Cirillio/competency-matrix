import { ORDERED_GRADES, type Grade, type SkillItem } from '../types/matrix';
import type { SkillProgressRecord } from '../types/progress';
import type { BonusSpecialization, EvaluationResult, GradeProgress } from '../types/evaluation';

/**
 * Pure evaluation engine for calculating frontend competency grade, coverage, and gap skills.
 * Supports manual target grade selection (effective target) and auto-calculated target.
 */
export function evaluateProgress(
  skills: SkillItem[],
  completedSkills: Record<string, SkillProgressRecord | { completedAt?: string; completed?: boolean }>,
  manualTargetGrade?: Grade | null
): EvaluationResult {
  // Support both new { completed: true } format and legacy { completedAt: '...' }
  const completedIds = new Set<string>();
  for (const [id, record] of Object.entries(completedSkills)) {
    if (record) {
      if (record.completed === true || (record.completed === undefined && 'completedAt' in record && Boolean(record.completedAt))) {
        completedIds.add(id);
      }
    }
  }

  // 1. Group skills by grade and requirement
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

    // Vacuous truth: empty bucket -> 1.0 (100% satisfied)
    const mandatoryCoverage =
      mandatorySkills.length === 0 ? 1.0 : completedMandatory / mandatorySkills.length;

    const desirableCoverage =
      desirableSkills.length === 0 ? 1.0 : completedDesirable / desirableSkills.length;

    // Strict integer comparison without float epsilon errors
    const isMandatorySatisfied =
      mandatorySkills.length === 0 || completedMandatory === mandatorySkills.length;
    const isDesirableSatisfied =
      desirableSkills.length === 0 || completedDesirable * 10 >= desirableSkills.length * 7;

    const isCertified = isMandatorySatisfied && isDesirableSatisfied;

    gradesProgress[grade] = {
      grade,
      isCertified,
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

  // 2. Strict consecutive certification chain for currentGrade
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

  // 3. Effective Target Grade resolution (Manual vs Auto)
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

  // 4. Gap skills (all uncompleted mandatory skills up to targetGrade inclusive)
  const gapSkills: SkillItem[] = [];
  if (targetGrade !== null) {
    const targetIndex = ORDERED_GRADES.indexOf(targetGrade);
    const relevantGrades = ORDERED_GRADES.slice(0, targetIndex + 1);
    const relevantGradesSet = new Set(relevantGrades);

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

  // 5. Progress metrics
  const totalSkillsCount = skills.length;
  const totalCompletedCount = skills.filter((s) => completedIds.has(s.id)).length;
  const matrixProgressPercent =
    totalSkillsCount === 0 ? 0 : Math.round((totalCompletedCount / totalSkillsCount) * 100);

  let targetGradeProgressPercent = 100;
  if (targetGrade !== null) {
    const targetProgress = gradesProgress[targetGrade];
    const covM = targetProgress.mandatoryCoverage;
    const covD = Math.min(1.0, targetProgress.desirableCoverage / 0.7);
    targetGradeProgressPercent = Math.round(((covM + covD) / 2) * 100);
  }

  // 6. Bonus Specializations
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
    if (completedIds.has(skill.id)) {
      spec.completedBonusSkills += 1;
    }
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
