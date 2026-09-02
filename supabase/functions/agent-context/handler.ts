// Pure request handler for the agent-context Edge Function.
// No Deno / network imports — index.ts supplies those as `deps`, and
// tests/edge/handler.test.ts exercises this with fakes.

import { evaluateProgress, type EvalSkill, type Grade } from './evaluator.ts';

export interface AgentContextDeps {
  /** The curated built-in matrix (read from public.builtin_skills). */
  getBuiltInSkills(): Promise<EvalSkill[]>;
  /** Resolve a raw bearer token to its owner, or null. Also bumps last_used_at. */
  resolveToken(token: string): Promise<{ ownerId: string } | null>;
  /** A user's stored progress blob. */
  fetchProgress(ownerId: string): Promise<{
    completedSkills: Record<string, { completed?: boolean; completedAt?: string }>;
    manualTargetGrade?: Grade | null;
    profile?: string;
  }>;
  /** A user's enabled competency packs. */
  fetchEnabledPackSkills(ownerId: string): Promise<EvalSkill[]>;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function bearer(req: Request): string | null {
  const raw = req.headers.get('Authorization') ?? '';
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function handleAgentContext(req: Request, deps: AgentContextDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/agent-context/, '').replace(/\/+$/, '') || '/';

  // Public: the built-in matrix, no token needed.
  if (path === '/matrix') {
    return json({ skills: await deps.getBuiltInSkills() });
  }

  if (path !== '/') return json({ error: 'not_found' }, 404);

  const token = bearer(req);
  if (!token) return json({ error: 'missing_token', hint: 'Send Authorization: Bearer cmx_…' }, 401);

  const owner = await deps.resolveToken(token);
  if (!owner) return json({ error: 'invalid_token' }, 401);

  const [builtIn, progress, packSkills] = await Promise.all([
    deps.getBuiltInSkills(),
    deps.fetchProgress(owner.ownerId),
    deps.fetchEnabledPackSkills(owner.ownerId),
  ]);

  const skills = [...builtIn, ...packSkills];
  const evaluation = evaluateProgress(
    skills,
    progress.completedSkills,
    progress.manualTargetGrade ?? null
  );

  const completedIds = Object.entries(progress.completedSkills)
    .filter(([, r]) => r?.completed === true || (r?.completed === undefined && Boolean(r?.completedAt)))
    .map(([id]) => id);

  return json({
    profile: progress.profile ?? null,
    level: {
      current: evaluation.currentGrade,
      target: evaluation.targetGrade,
      autoTarget: evaluation.autoTargetGrade,
      targetIsManual: evaluation.isTargetManual,
      certified: evaluation.certifiedGrades,
      progressToTargetPercent: evaluation.targetGradeProgressPercent,
      matrixCoveragePercent: evaluation.matrixProgressPercent,
    },
    completedSkillIds: completedIds,
    gapSkills: evaluation.gapSkills.map((s) => ({
      id: s.id,
      grade: s.grade,
      competency: s.competencyName,
      title: s.title,
      topics: s.topics,
    })),
    skillCount: skills.length,
  });
}

export { json as _json };
