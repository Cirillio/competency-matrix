import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFilterStore } from '../../src/stores/filter';
import { useProgressStore } from '../../src/stores/progress';
import { MemoryStorageDriver } from '../../src/services/storage/MemoryStorageDriver';

describe('useFilterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const progressStore = useProgressStore();
    progressStore.setDriver(new MemoryStorageDriver());
  });

  it('filters by Grade correctly', () => {
    const filterStore = useFilterStore();
    filterStore.selectedGrade = 'E1.1';

    expect(filterStore.filteredSkills.length).toBeGreaterThan(0);
    expect(filterStore.filteredSkills.every(s => s.grade === 'E1.1')).toBe(true);
  });

  it('grade filter is cumulative: a grade includes every grade below it', () => {
    const filterStore = useFilterStore();

    filterStore.selectedGrade = 'E1.1';
    const e11Count = filterStore.filteredSkills.length;

    filterStore.selectedGrade = 'E1.2';
    const upToE12 = filterStore.filteredSkills;

    // E1.2 now carries E1.1 along with it
    expect(upToE12.some(s => s.grade === 'E1.1')).toBe(true);
    expect(upToE12.some(s => s.grade === 'E1.2')).toBe(true);
    expect(upToE12.every(s => s.grade === 'E1.1' || s.grade === 'E1.2')).toBe(true);
    expect(upToE12.length).toBeGreaterThan(e11Count);

    // ...and nothing from higher grades leaks in
    expect(upToE12.some(s => s.grade === 'E2.1')).toBe(false);
  });

  it('top grade selection includes the whole matrix', () => {
    const filterStore = useFilterStore();
    const total = filterStore.filteredSkills.length; // 'all' by default

    filterStore.selectedGrade = 'E5.2';
    expect(filterStore.filteredSkills.length).toBe(total);
  });

  it('filters by Category and Requirement', () => {
    const filterStore = useFilterStore();
    filterStore.selectedCategory = 'Тех. скилы';
    filterStore.selectedRequirement = 'mandatory';

    expect(filterStore.filteredSkills.length).toBeGreaterThan(0);
    expect(filterStore.filteredSkills.every(s => s.category === 'Тех. скилы' && s.requirement === 'mandatory')).toBe(true);
  });

  it('filters by text search across title, description, topics', () => {
    const filterStore = useFilterStore();
    filterStore.searchQuery = 'rebase';

    expect(filterStore.filteredSkills.length).toBeGreaterThan(0);
    expect(filterStore.filteredSkills.some(s => s.title.toLowerCase().includes('rebase') || s.topics.some(t => t.includes('rebase')))).toBe(true);
  });

  it('filters by onlyUncompleted flag', async () => {
    const filterStore = useFilterStore();
    const progressStore = useProgressStore();

    const firstSkill = filterStore.filteredSkills[0];
    await progressStore.toggleSkill(firstSkill.id);

    filterStore.onlyUncompleted = true;
    expect(filterStore.filteredSkills.some(s => s.id === firstSkill.id)).toBe(false);
  });

  it('resets all filters to initial state', () => {
    const filterStore = useFilterStore();
    filterStore.searchQuery = 'webpack';
    filterStore.selectedGrade = 'E2.1';
    filterStore.onlyUncompleted = true;

    filterStore.resetFilters();
    expect(filterStore.searchQuery).toBe('');
    expect(filterStore.selectedGrade).toBe('all');
    expect(filterStore.onlyUncompleted).toBe(false);
  });
});
