import { describe, it, expect } from 'vitest';
import { evaluateProgress } from '../src/utils/gradeEvaluator';
import type { SkillItem } from '../src/types/matrix';
import matrixData from '../src/data/matrix.json';

const allSkills = matrixData.skills as SkillItem[];

describe('gradeEvaluator (TDD Unit Tests)', () => {
  it('01. Should evaluate empty progress correctly (Pre-E1.1)', () => {
    const result = evaluateProgress(allSkills, {});

    expect(result.currentGrade).toBe('Pre-E1.1');
    expect(result.targetGrade).toBe('E1.1');
    expect(result.autoTargetGrade).toBe('E1.1');
    expect(result.isTargetManual).toBe(false);
    expect(result.certifiedGrades).toEqual([]);
    expect(result.matrixProgressPercent).toBe(0);
    expect(result.targetGradeProgressPercent).toBe(0);

    // E1.1 has mandatory skills in gap
    const e11Mandatory = allSkills.filter(s => s.grade === 'E1.1' && s.requirement === 'mandatory');
    expect(result.gapSkills.length).toBe(e11Mandatory.length);
    expect(result.gapSkills.map(s => s.id)).toEqual(expect.arrayContaining(e11Mandatory.map(s => s.id)));

    // Total 10 grades must exist in gradesProgress
    expect(Object.keys(result.gradesProgress)).toHaveLength(10);
    expect(result.gradesProgress['E1.1'].isCertified).toBe(false);
    expect(result.gradesProgress['E1.1'].mandatoryCoverage).toBe(0);
  });

  it('02. Should handle Vacuous Truth (empty buckets) correctly without NaN or division by zero', () => {
    const result = evaluateProgress(allSkills, {});

    // E4.2 has 0 desirable skills in the dataset
    const e42Progress = result.gradesProgress['E4.2'];
    expect(e42Progress.totalDesirable).toBe(0);
    expect(e42Progress.desirableCoverage).toBe(1.0); // Vacuous truth: 0/0 -> 1.0

    // E5.2 has 0 mandatory skills in the dataset
    const e52Progress = result.gradesProgress['E5.2'];
    expect(e52Progress.totalMandatory).toBe(0);
    expect(e52Progress.mandatoryCoverage).toBe(1.0); // Vacuous truth: 0/0 -> 1.0
  });

  it('03. Should certify E1.1 when 100% mandatory and >=70% desirable are met', () => {
    const e11Mandatory = allSkills.filter(s => s.grade === 'E1.1' && s.requirement === 'mandatory');
    const e11Desirable = allSkills.filter(s => s.grade === 'E1.1' && s.requirement === 'desirable');

    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    e11Mandatory.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });
    e11Desirable.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    expect(result.gradesProgress['E1.1'].isCertified).toBe(true);
    expect(result.currentGrade).toBe('E1.1');
    expect(result.targetGrade).toBe('E1.2');
    expect(result.autoTargetGrade).toBe('E1.2');
    expect(result.isTargetManual).toBe(false);
    expect(result.certifiedGrades).toEqual(['E1.1']);
  });

  it('04. Should NOT certify grade if mandatory is < 100%', () => {
    const e11Mandatory = allSkills.filter(s => s.grade === 'E1.1' && s.requirement === 'mandatory');
    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    
    // Pass all except the last one
    e11Mandatory.slice(0, -1).forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    expect(result.gradesProgress['E1.1'].isCertified).toBe(false);
    expect(result.currentGrade).toBe('Pre-E1.1');
    expect(result.targetGrade).toBe('E1.1');
    expect(result.gapSkills).toHaveLength(1);
    expect(result.gapSkills[0].id).toBe(e11Mandatory[e11Mandatory.length - 1].id);
  });

  it('05. Strict continuity: Out-of-order completions do not raise currentGrade', () => {
    const skippedSkill = allSkills.find(s => s.grade === 'E1.1' && s.requirement === 'mandatory')!;
    const skillsToComplete = allSkills.filter(s => 
      ['E1.1', 'E1.2', 'E2.1', 'E2.2', 'E3.1'].includes(s.grade) && s.id !== skippedSkill.id
    );

    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    skillsToComplete.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    // E2.1 and E3.1 may be internally satisfied, but currentGrade MUST be Pre-E1.1 because E1.1 has a gap
    expect(result.currentGrade).toBe('Pre-E1.1');
    expect(result.targetGrade).toBe('E1.1');
    expect(result.gapSkills.some(s => s.id === skippedSkill.id)).toBe(true);
  });

  it('06. Target Grade calculation and progress percent', () => {
    // Fully complete E1.1
    const e11Skills = allSkills.filter(s => s.grade === 'E1.1');
    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    e11Skills.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    // Also complete 50% of E1.2 mandatory
    const e12Mandatory = allSkills.filter(s => s.grade === 'E1.2' && s.requirement === 'mandatory');
    const half = Math.floor(e12Mandatory.length / 2);
    e12Mandatory.slice(0, half).forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    expect(result.currentGrade).toBe('E1.1');
    expect(result.targetGrade).toBe('E1.2');
    expect(result.targetGradeProgressPercent).toBeGreaterThan(0);
    expect(result.targetGradeProgressPercent).toBeLessThan(100);
  });

  it('07. Maximum Grade E5.2 reached when all 139 skills completed', () => {
    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    allSkills.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    expect(result.currentGrade).toBe('E5.2');
    expect(result.targetGrade).toBeNull();
    expect(result.autoTargetGrade).toBeNull();
    expect(result.certifiedGrades).toHaveLength(10);
    expect(result.matrixProgressPercent).toBe(100);
    expect(result.targetGradeProgressPercent).toBe(100);
    expect(result.gapSkills).toHaveLength(0);
  });

  it('08. Bonus specializations aggregated correctly by competency', () => {
    const reactBonus = allSkills.filter(
      s => s.competencyId === 'react' && ['additional', 'optional'].includes(s.requirement)
    );

    const completed: Record<string, { completedAt: string; completed: boolean }> = {};
    reactBonus.forEach(s => { completed[s.id] = { completed: true, completedAt: '2026-08-30' }; });

    const result = evaluateProgress(allSkills, completed);

    if (reactBonus.length > 0) {
      const reactSpec = result.bonusSpecializations['react'];
      expect(reactSpec).toBeDefined();
      expect(reactSpec.totalBonusSkills).toBe(reactBonus.length);
      expect(reactSpec.completedBonusSkills).toBe(reactBonus.length);
      expect(reactSpec.percent).toBe(100);
    }
  });

  it('09. (C4) Boundary test for exact 70% desirable threshold with integer arithmetic', () => {
    const syntheticSkills: SkillItem[] = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `synth-mand-${i}`,
        competencyId: 'test',
        competencyName: 'Test',
        category: 'Test',
        section: 'Test',
        grade: 'E1.1' as const,
        requirement: 'mandatory' as const,
        title: `Mandatory ${i}`,
        description: '',
        topics: [],
        links: [],
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `synth-des-${i}`,
        competencyId: 'test',
        competencyName: 'Test',
        category: 'Test',
        section: 'Test',
        grade: 'E1.1' as const,
        requirement: 'desirable' as const,
        title: `Desirable ${i}`,
        description: '',
        topics: [],
        links: [],
      })),
    ];

    const completed: Record<string, { completed: boolean }> = {};
    for (let i = 0; i < 10; i++) completed[`synth-mand-${i}`] = { completed: true };

    // Case A: Exactly 6 desirable (60%) -> Certified must be FALSE
    for (let i = 0; i < 6; i++) completed[`synth-des-${i}`] = { completed: true };
    expect(evaluateProgress(syntheticSkills, completed).gradesProgress['E1.1'].isCertified).toBe(false);

    // Case B: Exactly 7 desirable (70%) -> Certified must be TRUE (7*10 >= 10*7)
    completed['synth-des-6'] = { completed: true };
    expect(evaluateProgress(syntheticSkills, completed).gradesProgress['E1.1'].isCertified).toBe(true);
  });

  it('10. (ШАГ 4) Manual target grade expands gapSkills when ahead of auto target', () => {
    // Current is Pre-E1.1 (autoTarget is E1.1), user manually selects E2.1 as target
    const result = evaluateProgress(allSkills, {}, 'E2.1');

    expect(result.currentGrade).toBe('Pre-E1.1');
    expect(result.autoTargetGrade).toBe('E1.1');
    expect(result.targetGrade).toBe('E2.1');
    expect(result.isTargetManual).toBe(true);

    // Gap skills should encompass mandatory skills for E1.1, E1.2, AND E2.1
    const relevantMandatory = allSkills.filter(
      s => ['E1.1', 'E1.2', 'E2.1'].includes(s.grade) && s.requirement === 'mandatory'
    );
    expect(result.gapSkills.length).toBe(relevantMandatory.length);
  });

  it('11. (ШАГ 4) Manual target grade <= currentGrade is ignored and falls back to auto target', () => {
    // Complete E1.1 -> currentGrade is E1.1, autoTarget is E1.2
    const e11Skills = allSkills.filter(s => s.grade === 'E1.1');
    const completed: Record<string, { completed: boolean }> = {};
    e11Skills.forEach(s => { completed[s.id] = { completed: true }; });

    // User tries to set manual target as E1.1 (which is <= currentGrade)
    const result = evaluateProgress(allSkills, completed, 'E1.1');

    expect(result.currentGrade).toBe('E1.1');
    expect(result.targetGrade).toBe('E1.2');
    expect(result.autoTargetGrade).toBe('E1.2');
    expect(result.isTargetManual).toBe(false);
  });

  it('12. (ШАГ 4) manualTargetGrade null falls back to auto target', () => {
    const result = evaluateProgress(allSkills, {}, null);

    expect(result.targetGrade).toBe('E1.1');
    expect(result.autoTargetGrade).toBe('E1.1');
    expect(result.isTargetManual).toBe(false);
  });
});
