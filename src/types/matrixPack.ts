import { z } from 'zod';
import { skillItemSchema, type SkillItem } from './matrix';

/** Shape of a JSON file a user imports to add competencies to their matrix. */
export const matrixPackSchema = z.object({
  name: z.string().min(1, 'Укажите название набора'),
  version: z.string().min(1).default('1.0.0'),
  skills: z.array(skillItemSchema).min(1, 'В наборе нет ни одного навыка'),
});
export type MatrixPack = z.infer<typeof matrixPackSchema>;

/** A pack as stored (Supabase row / local cache), with identity and on/off state. */
export const storedPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  enabled: z.boolean(),
  skills: z.array(skillItemSchema),
  createdAt: z.string(),
});
export type StoredPack = z.infer<typeof storedPackSchema>;

export const MAX_PACK_BYTES = 512 * 1024;
export const MAX_PACK_SKILLS = 2000;

export interface PackValidationOk {
  ok: true;
  pack: MatrixPack;
  /** Grades the pack touches — shown in the import summary. */
  grades: string[];
  competencyCount: number;
}
export interface PackValidationError {
  ok: false;
  /** Plain-language problems, ready to render as a list. */
  problems: string[];
}
export type PackValidationResult = PackValidationOk | PackValidationError;

/**
 * Validates raw parsed JSON against the schema and against the skills already
 * in play, so a pack can never silently shadow or duplicate existing skills.
 */
export function validatePack(raw: unknown, existingSkillIds: ReadonlySet<string>): PackValidationResult {
  const parsed = matrixPackSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.slice(0, 8).map((i) => {
      const path = i.path.join('.') || 'файл';
      return `${path}: ${i.message}`;
    });
    return { ok: false, problems };
  }

  const pack = parsed.data;
  const problems: string[] = [];

  if (pack.skills.length > MAX_PACK_SKILLS) {
    problems.push(`Слишком много навыков: ${pack.skills.length} (максимум ${MAX_PACK_SKILLS})`);
  }

  const seen = new Set<string>();
  const dupInside = new Set<string>();
  const clashWithExisting = new Set<string>();
  for (const skill of pack.skills) {
    if (seen.has(skill.id)) dupInside.add(skill.id);
    seen.add(skill.id);
    if (existingSkillIds.has(skill.id)) clashWithExisting.add(skill.id);
  }
  if (dupInside.size > 0) {
    problems.push(`Повторяющиеся id внутри набора: ${[...dupInside].slice(0, 10).join(', ')}`);
  }
  if (clashWithExisting.size > 0) {
    problems.push(
      `Эти навыки уже есть в матрице: ${[...clashWithExisting].slice(0, 10).join(', ')}` +
        (clashWithExisting.size > 10 ? ` и ещё ${clashWithExisting.size - 10}` : '')
    );
  }

  if (problems.length > 0) return { ok: false, problems };

  const grades = [...new Set(pack.skills.map((s) => s.grade))].sort();
  const competencyCount = new Set(pack.skills.map((s) => s.competencyId)).size;
  return { ok: true, pack, grades, competencyCount };
}

/** Skills from every enabled pack, in declared order. */
export function collectEnabledPackSkills(packs: readonly StoredPack[]): SkillItem[] {
  return packs.filter((p) => p.enabled).flatMap((p) => p.skills);
}
