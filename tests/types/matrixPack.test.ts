import { describe, it, expect } from 'vitest';
import { validatePack, collectEnabledPackSkills, type StoredPack } from '../../src/types/matrixPack';
import type { SkillItem } from '../../src/types/matrix';

function skill(overrides: Partial<SkillItem> = {}): SkillItem {
  return {
    id: 'x-1',
    competencyId: 'x',
    competencyName: 'X',
    category: 'Тех. скилы',
    section: 'Прочее',
    grade: 'E1.1',
    requirement: 'mandatory',
    title: 'Skill',
    description: '',
    topics: [],
    links: [],
    ...overrides,
  };
}

const noExisting = new Set<string>();

describe('validatePack', () => {
  it('accepts a well-formed pack and reports its shape', () => {
    const result = validatePack(
      { name: 'Бэкенд', version: '1.0.0', skills: [skill({ id: 'a' }), skill({ id: 'b', grade: 'E2.1' })] },
      noExisting
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.competencyCount).toBe(1);
      expect(result.grades).toEqual(['E1.1', 'E2.1']);
    }
  });

  it('rejects a pack with no name', () => {
    const result = validatePack({ version: '1', skills: [skill()] }, noExisting);
    expect(result.ok).toBe(false);
  });

  it('rejects an empty skill list', () => {
    const result = validatePack({ name: 'Пусто', skills: [] }, noExisting);
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown grade', () => {
    const result = validatePack(
      { name: 'N', skills: [{ ...skill(), grade: 'E9.9' }] },
      noExisting
    );
    expect(result.ok).toBe(false);
  });

  it('reports duplicate ids inside the pack', () => {
    const result = validatePack(
      { name: 'Dup', skills: [skill({ id: 'same' }), skill({ id: 'same' })] },
      noExisting
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).toMatch(/Повторяющиеся id/);
  });

  it('reports ids that collide with skills already in the matrix', () => {
    const result = validatePack(
      { name: 'Clash', skills: [skill({ id: 'git-e1.1-ui-client' })] },
      new Set(['git-e1.1-ui-client'])
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).toMatch(/уже есть в матрице/);
  });
});

describe('collectEnabledPackSkills', () => {
  it('returns skills from enabled packs only', () => {
    const packs: StoredPack[] = [
      { id: '1', name: 'On', version: '1', enabled: true, createdAt: '', skills: [skill({ id: 'on' })] },
      { id: '2', name: 'Off', version: '1', enabled: false, createdAt: '', skills: [skill({ id: 'off' })] },
    ];
    expect(collectEnabledPackSkills(packs).map((s) => s.id)).toEqual(['on']);
  });
});
