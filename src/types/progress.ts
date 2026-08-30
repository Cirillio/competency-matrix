import { z } from 'zod';
import { gradeSchema } from './matrix';

export const PROGRESS_SCHEMA_VERSION = '2.0.0';

export const skillProgressRecordSchema = z.object({
  completed: z.boolean().default(true),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
});
export type SkillProgressRecord = z.infer<typeof skillProgressRecordSchema>;

export const userProgressSchema = z.object({
  version: z.string().default(PROGRESS_SCHEMA_VERSION),
  updatedAt: z.string(),
  manualTargetGrade: gradeSchema.nullable().optional(),
  completedSkills: z.record(z.string(), skillProgressRecordSchema),
});
export type UserProgress = z.infer<typeof userProgressSchema>;
