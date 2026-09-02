import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { handleAgentContext, type AgentContextDeps } from './handler.ts';
import type { EvalSkill } from './evaluator.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function pg<T = unknown>(query: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
  return (init?.method === 'PATCH' || init?.method === 'DELETE' ? null : await res.json()) as T;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface BuiltinRow {
  id: string;
  competency_id: string;
  competency_name: string;
  grade: EvalSkill['grade'];
  requirement: EvalSkill['requirement'];
  title: string;
  topics: string[];
}

let builtInCache: EvalSkill[] | null = null;

async function getBuiltInSkills(): Promise<EvalSkill[]> {
  if (builtInCache) return builtInCache;
  const rows = await pg<BuiltinRow[]>(
    'builtin_skills?select=id,competency_id,competency_name,grade,requirement,title,topics&order=sort.asc'
  );
  builtInCache = rows.map((r) => ({
    id: r.id,
    competencyId: r.competency_id,
    competencyName: r.competency_name,
    grade: r.grade,
    requirement: r.requirement,
    title: r.title,
    topics: r.topics ?? [],
  }));
  return builtInCache;
}

const deps: AgentContextDeps = {
  getBuiltInSkills,

  async resolveToken(token) {
    const hash = await sha256Hex(token);
    const rows = await pg<{ owner_id: string }[]>(
      `api_tokens?token_hash=eq.${hash}&revoked=eq.false&select=owner_id`
    );
    if (!rows.length) return null;
    pg(`api_tokens?token_hash=eq.${hash}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    }).catch(() => {});
    return { ownerId: rows[0].owner_id };
  },

  async fetchProgress(ownerId) {
    const rows = await pg<{ data: Record<string, unknown> }[]>(
      `progress?user_id=eq.${ownerId}&select=data`
    );
    const data = (rows[0]?.data ?? {}) as {
      completedSkills?: Record<string, { completed?: boolean; completedAt?: string }>;
      manualTargetGrade?: string | null;
      profile?: string;
    };
    return {
      completedSkills: data.completedSkills ?? {},
      manualTargetGrade: (data.manualTargetGrade ?? null) as never,
      profile: data.profile,
    };
  },

  async fetchEnabledPackSkills(ownerId) {
    const rows = await pg<{ data: { skills?: EvalSkill[] } }[]>(
      `matrix_packs?owner_id=eq.${ownerId}&enabled=eq.true&select=data`
    );
    return rows.flatMap((r) =>
      (r.data?.skills ?? []).map((s) => ({
        id: s.id,
        competencyId: s.competencyId,
        competencyName: s.competencyName,
        grade: s.grade,
        requirement: s.requirement,
        title: s.title,
        topics: s.topics ?? [],
      }))
    );
  },
};

Deno.serve((req) => handleAgentContext(req, deps));
