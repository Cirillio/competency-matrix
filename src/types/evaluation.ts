import type { Grade, SkillItem } from './matrix';

export interface GradeProgress {
  grade: Grade;
  isCertified: boolean;
  mandatoryCoverage: number; // 0.0 .. 1.0
  desirableCoverage: number; // 0.0 .. 1.0
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
  percent: number; // 0 .. 100
}

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
