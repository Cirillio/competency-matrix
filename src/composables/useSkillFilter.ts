import { useFilterStore } from '../stores/filter';
import { useMatrixStore } from '../stores/matrix';
import { useProgressStore } from '../stores/progress';

export function useSkillFilter() {
  const filterStore = useFilterStore();
  const matrixStore = useMatrixStore();
  const progressStore = useProgressStore();

  return {
    filterStore,
    matrixStore,
    progressStore,
    filteredSkills: filterStore.filteredSkills,
  };
}
