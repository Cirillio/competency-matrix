import { z } from 'zod';

export const ORDERED_GRADES = [
  'E1.1', 'E1.2',
  'E2.1', 'E2.2',
  'E3.1', 'E3.2',
  'E4.1', 'E4.2',
  'E5.1', 'E5.2'
] as const;

export const gradeSchema = z.enum(ORDERED_GRADES);
export type Grade = z.infer<typeof gradeSchema>;

export const requirementLevelSchema = z.enum(['mandatory', 'desirable', 'additional', 'optional']);
export type RequirementLevel = z.infer<typeof requirementLevelSchema>;

export const resourceLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
});
export type ResourceLink = z.infer<typeof resourceLinkSchema>;

export const skillItemSchema = z.object({
  id: z.string().min(1),
  competencyId: z.string().min(1),
  competencyName: z.string().min(1),
  category: z.string().min(1),
  section: z.string().min(1),
  grade: gradeSchema,
  requirement: requirementLevelSchema,
  title: z.string().min(1),
  description: z.string(),
  topics: z.array(z.string()),
  links: z.array(resourceLinkSchema),
});
export type SkillItem = z.infer<typeof skillItemSchema>;

export const matrixDataSchema = z.object({
  version: z.string(),
  skills: z.array(skillItemSchema),
});
export type MatrixData = z.infer<typeof matrixDataSchema>;
