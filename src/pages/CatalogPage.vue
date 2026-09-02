<script setup lang="ts">
import { computed, ref } from 'vue';
import { AccordionRoot } from 'reka-ui';
import { RouterLink } from 'vue-router';
import { useMatrixStore } from '../stores/matrix';
import { ORDERED_GRADES, type Grade, type SkillItem } from '../types/matrix';
import AppSelect, { type SelectOption } from '../components/common/AppSelect.vue';
import CatalogSection from '../components/catalog/CatalogSection.vue';
import { PhMagnifyingGlass, PhX, PhArrowRight } from '@phosphor-icons/vue';

interface CompetencyGroup {
  id: string;
  name: string;
  section: string;
  skills: SkillItem[];
}

const matrixStore = useMatrixStore();

const search = ref('');
const grade = ref<Grade | 'all'>('all');
const section = ref<string | 'all'>('all');

const sectionOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Все разделы' },
  ...matrixStore.sections.map((s) => ({ value: s, label: s })),
]);

const gradeModel = computed({
  get: () => grade.value as string,
  set: (v: string) => { grade.value = v as Grade | 'all'; },
});
const sectionModel = computed({
  get: () => section.value as string,
  set: (v: string) => { section.value = v; },
});

const gradeOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Любой уровень' },
  ...ORDERED_GRADES.map((g) => ({ value: g, label: g })),
]);

const filtered = computed<SkillItem[]>(() => {
  const q = search.value.trim().toLowerCase();
  const maxGradeIndex = grade.value === 'all' ? Infinity : ORDERED_GRADES.indexOf(grade.value);

  return matrixStore.builtInSkills.filter((skill) => {
    if (ORDERED_GRADES.indexOf(skill.grade) > maxGradeIndex) return false;
    if (section.value !== 'all' && skill.section !== section.value) return false;
    if (q) {
      const hit =
        skill.title.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.competencyName.toLowerCase().includes(q) ||
        skill.topics.some((t) => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });
});

const grouped = computed<CompetencyGroup[]>(() => {
  const map = new Map<string, CompetencyGroup>();
  for (const skill of filtered.value) {
    let g = map.get(skill.competencyId);
    if (!g) {
      g = { id: skill.competencyId, name: skill.competencyName, section: skill.section, skills: [] };
      map.set(skill.competencyId, g);
    }
    g.skills.push(skill);
  }
  return Array.from(map.values());
});

const hasFilters = computed(
  () => Boolean(search.value.trim()) || grade.value !== 'all' || section.value !== 'all'
);

// When filtering, open every match; otherwise keep the user's own set.
const openIds = ref<string[]>([]);
const accordionValue = computed<string[]>({
  get: () => (hasFilters.value ? grouped.value.map((g) => g.id) : openIds.value),
  set: (v) => { if (!hasFilters.value) openIds.value = v; },
});

function reset() {
  search.value = '';
  grade.value = 'all';
  section.value = 'all';
}
</script>

<template>
  <div class="space-y-8">
    <!-- Intro -->
    <div class="space-y-3 max-w-2xl">
      <h2 class="text-2xl font-semibold tracking-tight text-(--text-primary)">
        Что должен знать фронтенд-инженер
      </h2>
      <p class="text-sm leading-relaxed text-(--text-secondary)">
        {{ matrixStore.builtInSkills.length }} навыков по уровням от Junior до Principal — с описанием,
        ключевыми темами и ссылками на документацию. Откройте трекер, чтобы отмечать пройденное
        и видеть свой уровень.
      </p>
      <RouterLink
        to="/tracker"
        class="inline-flex items-center gap-1.5 text-sm text-(--accent) hover:underline rounded
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        Открыть трекер
        <PhArrowRight :size="15" />
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-2.5 sm:items-end">
      <div class="relative flex-1">
        <PhMagnifyingGlass
          :size="16"
          class="text-(--text-tertiary) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <input
          v-model="search"
          type="text"
          aria-label="Поиск по навыкам"
          placeholder="Поиск"
          class="w-full min-h-10 rounded-lg bg-(--surface-1) pl-9 pr-9 text-xs
                 text-(--text-primary) placeholder-(--text-tertiary)
                 focus:outline-none focus:ring-2 focus:ring-(--accent)"
        >
        <button
          v-if="search"
          type="button"
          aria-label="Очистить поиск"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer
                 text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
          @click="search = ''"
        >
          <PhX :size="14" />
        </button>
      </div>
      <div class="w-full sm:w-40">
        <AppSelect v-model="gradeModel" label="Уровень" :options="gradeOptions" />
      </div>
      <div class="w-full sm:w-52">
        <AppSelect v-model="sectionModel" label="Раздел" :options="sectionOptions" />
      </div>
    </div>

    <!-- Catalogue -->
    <AccordionRoot v-if="grouped.length > 0" v-model="accordionValue" type="multiple" class="space-y-2">
      <CatalogSection
        v-for="group in grouped"
        :key="group.id"
        :id="group.id"
        :name="group.name"
        :section="group.section"
        :skills="group.skills"
      />
    </AccordionRoot>

    <div v-else class="rounded-2xl bg-(--surface-1) p-10 text-center space-y-2">
      <p class="text-xs font-medium text-(--text-secondary)">Ничего не найдено</p>
      <button
        type="button"
        class="text-[11px] text-(--accent) cursor-pointer hover:underline rounded
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        @click="reset"
      >
        Сбросить фильтры
      </button>
    </div>
  </div>
</template>
