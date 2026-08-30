import type { Grade } from '../types/matrix';

export interface GradeMeta {
  label: string;
  shortLabel: string;
  tier: 'Junior' | 'Middle' | 'Senior' | 'Lead' | 'Principal' | 'Pre';
}

export const GRADE_DETAILS: Record<Grade | 'Pre-E1.1', GradeMeta> = {
  'Pre-E1.1': { label: 'Старт', shortLabel: 'до Junior', tier: 'Pre' },
  'E1.1': { label: 'Junior 1', shortLabel: 'младший junior', tier: 'Junior' },
  'E1.2': { label: 'Junior 2', shortLabel: 'junior', tier: 'Junior' },
  'E2.1': { label: 'Middle 1', shortLabel: 'младший middle', tier: 'Middle' },
  'E2.2': { label: 'Middle 2', shortLabel: 'middle', tier: 'Middle' },
  'E3.1': { label: 'Senior 1', shortLabel: 'младший senior', tier: 'Senior' },
  'E3.2': { label: 'Senior 2', shortLabel: 'senior', tier: 'Senior' },
  'E4.1': { label: 'Lead 1', shortLabel: 'team/tech lead', tier: 'Lead' },
  'E4.2': { label: 'Lead 2', shortLabel: 'staff lead', tier: 'Lead' },
  'E5.1': { label: 'Principal 1', shortLabel: 'principal engineer', tier: 'Principal' },
  'E5.2': { label: 'Principal 2', shortLabel: 'distinguished engineer', tier: 'Principal' },
};

export interface TierGroup {
  name: 'Junior' | 'Middle' | 'Senior' | 'Lead' | 'Principal';
  grades: Grade[];
}

export const TIERS: TierGroup[] = [
  { name: 'Junior', grades: ['E1.1', 'E1.2'] },
  { name: 'Middle', grades: ['E2.1', 'E2.2'] },
  { name: 'Senior', grades: ['E3.1', 'E3.2'] },
  { name: 'Lead', grades: ['E4.1', 'E4.2'] },
  { name: 'Principal', grades: ['E5.1', 'E5.2'] },
];
