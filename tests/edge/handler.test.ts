import { describe, it, expect } from 'vitest';
import { handleAgentContext, type AgentContextDeps } from '../../supabase/functions/agent-context/handler';
import type { EvalSkill } from '../../supabase/functions/agent-context/evaluator';

const builtInSkills: EvalSkill[] = [
  { id: 'a', competencyId: 'x', competencyName: 'X', grade: 'E1.1', requirement: 'mandatory', title: 'A', topics: [] },
  { id: 'b', competencyId: 'x', competencyName: 'X', grade: 'E1.1', requirement: 'mandatory', title: 'B', topics: [] },
];

function makeDeps(over: Partial<AgentContextDeps> = {}): AgentContextDeps {
  return {
    async getBuiltInSkills() {
      return builtInSkills;
    },
    async resolveToken(token) {
      return token === 'cmx_good' ? { ownerId: 'user-1' } : null;
    },
    async fetchProgress() {
      return { completedSkills: { a: { completed: true } }, manualTargetGrade: null, profile: 'React dev' };
    },
    async fetchEnabledPackSkills() {
      return [];
    },
    ...over,
  };
}

const req = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://x.functions.supabase.co/agent-context${path}`, { headers });

describe('handleAgentContext', () => {
  it('serves the built-in matrix without a token', async () => {
    const res = await handleAgentContext(req('/matrix'), makeDeps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skills).toHaveLength(2);
  });

  it('401s without a bearer token', async () => {
    const res = await handleAgentContext(req('/'), makeDeps());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('missing_token');
  });

  it('401s on an unknown token', async () => {
    const res = await handleAgentContext(req('/', { Authorization: 'Bearer cmx_bad' }), makeDeps());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('invalid_token');
  });

  it('returns level, gaps and profile for a valid token', async () => {
    const res = await handleAgentContext(req('/', { Authorization: 'Bearer cmx_good' }), makeDeps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toBe('React dev');
    expect(body.completedSkillIds).toEqual(['a']);
    expect(body.gapSkills.map((s: { id: string }) => s.id)).toEqual(['b']);
    expect(body.level.current).toBe('Pre-E1.1');
    expect(body.skillCount).toBe(2);
  });

  it('merges enabled pack skills into the evaluation', async () => {
    const deps = makeDeps({
      async fetchEnabledPackSkills() {
        return [
          { id: 'p1', competencyId: 'node', competencyName: 'Node', grade: 'E1.1', requirement: 'mandatory', title: 'P1', topics: [] },
        ];
      },
    });
    const res = await handleAgentContext(req('/', { Authorization: 'Bearer cmx_good' }), deps);
    const body = await res.json();
    expect(body.skillCount).toBe(3);
    expect(body.gapSkills.map((s: { id: string }) => s.id).sort()).toEqual(['b', 'p1']);
  });

  it('handles CORS preflight', async () => {
    const res = await handleAgentContext(
      new Request('https://x/agent-context/', { method: 'OPTIONS' }),
      makeDeps()
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
