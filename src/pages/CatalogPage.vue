<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AccordionRoot } from 'reka-ui';
import { RouterLink } from 'vue-router';
import { useMatrixStore } from '../stores/matrix';
import { usePacksStore } from '../stores/packs';
import { ORDERED_GRADES, type Grade, type SkillItem } from '../types/matrix';
import { BUILTIN_MATRIX_LABEL } from '../config/app';
import AppSelect, { type SelectOption } from '../components/common/AppSelect.vue';
import CatalogSection from '../components/catalog/CatalogSection.vue';
import { PhMagnifyingGlass, PhX, PhArrowRight } from '@phosphor-icons/vue';

interface CompetencyGroup {
  id: string;
  name: string;
  section: string;
  skills: SkillItem[];
}
interface MatrixOption {
  id: string;
  label: string;
  skills: readonly SkillItem[];
}

const matrixStore = useMatrixStore();
const packsStore = usePacksStore();

// Frontend is always public; a signed-in user's enabled imports are extra directions.
const matrices = computed<MatrixOption[]>(() => [
  { id: 'builtin', label: BUILTIN_MATRIX_LABEL, skills: matrixStore.builtInSkills },
  ...packsStore.packs
    .filter((p) => p.enabled)
    .map((p) => ({ id: p.id, label: p.name, skills: p.skills })),
]);

const activeId = ref('builtin');
watch(matrices, (list) => {
  if (!list.some((m) => m.id === activeId.value)) activeId.value = 'builtin';
});
const active = computed(() => matrices.value.find((m) => m.id === activeId.value) ?? matrices.value[0]);

const search = ref('');
const grade = ref<Grade | 'all'>('all');
const section = ref<string | 'all'>('all');

watch(activeId, () => {
  search.value = '';
  grade.value = 'all';
  section.value = 'all';
});

const sectionsOfActive = computed(() =>
  Array.from(new Set(active.value.skills.map((s) => s.section)))
);
const sectionOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Все разделы' },
  ...sectionsOfActive.value.map((s) => ({ value: s, label: s })),
]);
const gradeOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Любой уровень' },
  ...ORDERED_GRADES.map((g) => ({ value: g, label: g })),
]);

const gradeModel = computed({
  get: () => grade.value as string,
  set: (v: string) => { grade.value = v as Grade | 'all'; },
});
const sectionModel = computed({
  get: () => section.value as string,
  set: (v: string) => { section.value = v; },
});

const filtered = computed<SkillItem[]>(() => {
  const q = search.value.trim().toLowerCase();
  const maxGradeIndex = grade.value === 'all' ? Infinity : ORDERED_GRADES.indexOf(grade.value);

  return active.value.skills.filter((skill) => {
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
    <!-- Intro: matrices by direction, not just Frontend -->
    <div class="space-y-3 max-w-2xl">
      <h2 class="text-2xl font-semibold tracking-tight text-(--text-primary)">
        Матрицы компетенций по направлениям
      </h2>
      <p class="text-sm leading-relaxed text-(--text-secondary)">
        Публично открыта матрица <strong class="text-(--text-primary)">{{ BUILTIN_MATRIX_LABEL }}</strong> —
        {{ matrixStore.builtInSkills.length }} навыков по уровням от Junior до Principal. Войдите в
        трекер и загрузите свои матрицы для других направлений — Backend, QA, DevOps, любых.
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

    <!-- Direction picker -->
    <div class="space-y-2">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="m in matrices"
          :key="m.id"
          type="button"
          :aria-pressed="m.id === activeId"
          :class="[
            'min-h-9 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
            m.id === activeId
              ? 'bg-(--text-primary) text-(--surface-0)'
              : 'bg-(--surface-1) text-(--text-secondary) hover:text-(--text-primary)',
          ]"
          @click="activeId = m.id"
        >
          {{ m.label }}
          <span class="ml-1.5 font-mono opacity-60">{{ m.skills.length }}</span>
        </button>
      </div>
      <p v-if="matrices.length === 1" class="text-[11px] text-(--text-tertiary)">
        Другие направления появятся здесь после того, как вы загрузите их в трекере.
      </p>
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

    <!-- Catalogue of the selected matrix -->
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
