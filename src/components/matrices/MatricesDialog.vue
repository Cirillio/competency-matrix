<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  TabsRoot, TabsList, TabsTrigger, TabsContent,
  AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent,
} from 'reka-ui';
import { usePacksStore } from '../../stores/packs';
import { useMatrixStore } from '../../stores/matrix';
import { useToast } from '../../composables/useToast';
import { validatePack, type PackValidationResult } from '../../types/matrixPack';
import { PACK_FIELDS, PACK_TEMPLATE_JSON } from '../../config/packFormat';
import { APP_NAME_SHORT } from '../../config/app';
import type { SkillItem } from '../../types/matrix';
import AppDialog from '../common/AppDialog.vue';
import AppSwitch from '../common/AppSwitch.vue';
import {
  PhTrash, PhUploadSimple, PhWarning, PhCaretRight, PhFilePlus, PhDownloadSimple, PhCheckCircle,
} from '@phosphor-icons/vue';

const open = defineModel<boolean>('open', { default: false });

const packsStore = usePacksStore();
const matrixStore = useMatrixStore();
const toast = useToast();

const tab = ref<'list' | 'import'>('list');
const jsonText = ref('');
const busy = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    tab.value = 'list';
    jsonText.value = '';
    if (!packsStore.isLoaded) packsStore.load();
  }
});

// ─── navigable list: built-in + each pack, expandable to competencies ───
interface MatrixEntry {
  key: string;
  name: string;
  subtitle: string;
  builtIn: boolean;
  enabled: boolean;
  packId?: string;
  competencies: { id: string; name: string; count: number }[];
}

function groupCompetencies(skills: readonly SkillItem[]) {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const s of skills) {
    const g = map.get(s.competencyId) ?? { id: s.competencyId, name: s.competencyName, count: 0 };
    g.count += 1;
    map.set(s.competencyId, g);
  }
  return [...map.values()];
}

const entries = computed<MatrixEntry[]>(() => {
  const builtIn: MatrixEntry = {
    key: 'builtin',
    name: `${APP_NAME_SHORT} — встроенная`,
    subtitle: `${matrixStore.builtInSkills.length} навыков · только чтение`,
    builtIn: true,
    enabled: true,
    competencies: groupCompetencies(matrixStore.builtInSkills),
  };
  const packs = packsStore.packs.map<MatrixEntry>((p) => ({
    key: p.id,
    packId: p.id,
    name: p.name,
    subtitle: `${p.skills.length} навыков · v${p.version}`,
    builtIn: false,
    enabled: p.enabled,
    competencies: groupCompetencies(p.skills),
  }));
  return [builtIn, ...packs];
});

// ─── import validation ───
const knownIds = computed(() => {
  const ids = new Set(matrixStore.builtInSkills.map((s) => s.id));
  for (const p of packsStore.packs) for (const s of p.skills) ids.add(s.id);
  return ids;
});

const preview = computed<PackValidationResult | null>(() => {
  const text = jsonText.value.trim();
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, problems: ['Это не похоже на JSON — проверьте синтаксис'] };
  }
  return validatePack(parsed, knownIds.value);
});

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  jsonText.value = await file.text();
  (e.target as HTMLInputElement).value = '';
}

function downloadTemplate() {
  const blob = new Blob([PACK_TEMPLATE_JSON], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'matrix-template.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function doImport() {
  if (busy.value) return;
  busy.value = true;
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText.value);
    } catch {
      toast.error('Не удалось прочитать JSON');
      return;
    }
    const builtInIds = new Set(matrixStore.builtInSkills.map((s) => s.id));
    const outcome = await packsStore.importPack(parsed, builtInIds);
    if (outcome.ok) {
      toast.success('Матрица добавлена', outcome.packName);
      jsonText.value = '';
      tab.value = 'list';
    } else {
      toast.error('Матрица не добавлена', outcome.problems?.[0]);
    }
  } finally {
    busy.value = false;
  }
}

async function onDelete(id: string, name: string) {
  await packsStore.remove(id);
  toast.notify('Матрица удалена', name);
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    size="lg"
    title="Матрицы"
    description="Встроенная матрица плюс ваши наборы компетенций. Включённые наборы добавляются к матрице и влияют на расчёт уровня."
  >
    <TabsRoot v-model="tab" class="flex flex-col gap-4">
      <TabsList class="flex items-center gap-1 p-1 rounded-lg bg-(--surface-1) self-start" aria-label="Разделы">
        <TabsTrigger
          v-for="t in [{ v: 'list', l: 'Список' }, { v: 'import', l: 'Добавить' }]"
          :key="t.v"
          :value="t.v"
          class="min-h-9 px-3 rounded-md text-xs cursor-pointer transition-colors outline-none
                 text-(--text-tertiary) hover:text-(--text-secondary)
                 data-[state=active]:bg-(--surface-3) data-[state=active]:text-(--text-primary)
                 focus-visible:ring-2 focus-visible:ring-(--accent)"
        >
          {{ t.l }}
        </TabsTrigger>
      </TabsList>

      <!-- ─── Список ─── -->
      <TabsContent value="list" class="outline-none space-y-3">
        <AccordionRoot type="multiple" class="space-y-2">
          <AccordionItem
            v-for="entry in entries"
            :key="entry.key"
            :value="entry.key"
            class="rounded-xl bg-(--surface-1) overflow-hidden"
          >
            <AccordionHeader as="h3">
              <AccordionTrigger
                class="group w-full min-h-14 px-3 flex items-center gap-3 text-left cursor-pointer
                       transition-colors hover:bg-(--surface-2)
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
              >
                <PhCaretRight
                  :size="14"
                  class="shrink-0 text-(--text-tertiary) transition-transform duration-200
                         group-data-[state=open]:rotate-90"
                />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-medium text-(--text-primary)">
                    {{ entry.name }}
                    <span v-if="!entry.enabled" class="ml-1.5 text-[10px] text-(--text-tertiary)">выключена</span>
                  </span>
                  <span class="block truncate text-[11px] font-mono text-(--text-tertiary)">
                    {{ entry.subtitle }} · {{ entry.competencies.length }} компетенций
                  </span>
                </span>

                <span
                  v-if="!entry.builtIn"
                  class="shrink-0 flex items-center gap-2"
                  @click.stop
                  @keydown.stop
                >
                  <AppSwitch
                    :model-value="entry.enabled"
                    :label="`Включить матрицу ${entry.name}`"
                    @update:model-value="packsStore.toggle(entry.packId!)"
                  />
                  <button
                    type="button"
                    :aria-label="`Удалить матрицу ${entry.name}`"
                    class="p-1.5 rounded-lg text-(--text-tertiary) hover:text-(--critical)
                           hover:bg-(--surface-3) cursor-pointer transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                    @click="onDelete(entry.packId!, entry.name)"
                  >
                    <PhTrash :size="14" />
                  </button>
                </span>
              </AccordionTrigger>
            </AccordionHeader>

            <AccordionContent
              class="overflow-hidden
                     data-[state=open]:animate-[accordion-down_220ms_ease-out]
                     data-[state=closed]:animate-[accordion-up_180ms_ease-out]"
            >
              <ul class="px-3 pb-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <li
                  v-for="c in entry.competencies"
                  :key="c.id"
                  class="flex items-baseline justify-between gap-2 text-[11px]"
                >
                  <span class="truncate text-(--text-secondary)">{{ c.name }}</span>
                  <span class="shrink-0 font-mono text-(--text-tertiary)">{{ c.count }}</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>

        <!-- friendly empty state (no imported matrices yet) -->
        <div
          v-if="packsStore.packs.length === 0"
          class="rounded-xl bg-(--surface-1) p-5 text-center space-y-3"
        >
          <PhFilePlus :size="22" class="mx-auto text-(--text-tertiary)" />
          <div class="space-y-1">
            <p class="text-sm text-(--text-primary)">Своих матриц пока нет</p>
            <p class="text-[11px] text-(--text-secondary) max-w-sm mx-auto">
              Загрузите набор компетенций из JSON-файла — он появится здесь рядом со встроенной
              матрицей, а его навыки войдут в расчёт вашего уровня.
            </p>
          </div>
          <button
            type="button"
            class="min-h-9 px-3.5 rounded-lg bg-(--accent) text-white text-xs font-semibold
                   cursor-pointer transition-opacity hover:opacity-90
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="tab = 'import'"
          >
            Загрузить матрицу
          </button>
        </div>
      </TabsContent>

      <!-- ─── Добавить ─── -->
      <TabsContent value="import" class="outline-none space-y-5">
        <!-- format spec, laid out as fields (not a placeholder) -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-xs font-semibold text-(--text-primary)">Формат файла</h3>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-[11px] text-(--accent) cursor-pointer hover:underline
                     rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
              @click="downloadTemplate"
            >
              <PhDownloadSimple :size="14" />
              Скачать шаблон
            </button>
          </div>

          <div class="rounded-xl bg-(--surface-1) overflow-x-auto">
            <table class="w-full text-[11px]">
              <thead>
                <tr class="text-(--text-tertiary) text-left">
                  <th class="font-medium px-3 py-2">Поле</th>
                  <th class="font-medium px-3 py-2">Тип</th>
                  <th class="font-medium px-3 py-2">Пример</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in PACK_FIELDS" :key="f.path" class="align-top border-t border-(--surface-2)">
                  <td class="px-3 py-2 font-mono text-(--text-primary) whitespace-nowrap">
                    {{ f.path }}
                    <span v-if="f.required" class="text-(--critical)" title="обязательное">*</span>
                  </td>
                  <td class="px-3 py-2 font-mono text-(--text-secondary)">{{ f.type }}</td>
                  <td class="px-3 py-2 font-mono text-(--text-tertiary)">{{ f.example }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <details class="rounded-xl bg-(--surface-1) overflow-hidden">
            <summary class="px-3 py-2 text-[11px] text-(--text-secondary) cursor-pointer select-none">
              Полный пример
            </summary>
            <pre class="px-3 pb-3 pt-0 text-[11px] font-mono leading-relaxed text-(--text-secondary) overflow-x-auto">{{ PACK_TEMPLATE_JSON }}</pre>
          </details>

          <ul class="text-[11px] text-(--text-tertiary) space-y-0.5 pl-4 list-disc">
            <li><span class="text-(--critical)">*</span> — обязательное поле</li>
            <li><code class="font-mono">id</code> не должен совпадать с навыком встроенной матрицы или другого набора</li>
            <li>грейд подтверждается при 100% <code class="font-mono">mandatory</code> и ≥70% <code class="font-mono">desirable</code> его уровня</li>
          </ul>
        </section>

        <!-- input -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <label for="pack-json" class="text-xs text-(--text-secondary)">
              JSON матрицы — вставьте текст или выберите файл
            </label>
            <label class="inline-flex items-center gap-1.5 text-[11px] text-(--accent) cursor-pointer hover:underline">
              <PhUploadSimple :size="14" />
              <span>Выбрать файл</span>
              <input type="file" accept=".json,application/json" class="hidden" @change="onFile">
            </label>
          </div>

          <textarea
            id="pack-json"
            v-model="jsonText"
            rows="6"
            spellcheck="false"
            class="w-full resize-y rounded-lg bg-(--surface-1) p-3 text-[11px] font-mono leading-relaxed
                   text-(--text-primary) placeholder-(--text-tertiary)
                   focus:outline-none focus:ring-1 focus:ring-(--accent)"
          />

          <div v-if="preview && !preview.ok" class="rounded-lg bg-(--critical-subtle) p-3 space-y-1">
            <div class="flex items-center gap-1.5 text-[11px] font-semibold text-(--critical)">
              <PhWarning :size="14" />
              <span>Матрицу нельзя добавить</span>
            </div>
            <ul class="text-[11px] text-(--text-secondary) space-y-0.5 pl-5 list-disc">
              <li v-for="(p, i) in preview.problems" :key="i">{{ p }}</li>
            </ul>
          </div>

          <div
            v-else-if="preview && preview.ok"
            class="rounded-lg bg-(--surface-1) p-3 text-[11px] text-(--text-secondary) flex items-start gap-2"
          >
            <PhCheckCircle :size="14" class="mt-0.5 shrink-0 text-(--success)" />
            <span>
              <strong class="text-(--text-primary)">{{ preview.pack.name }}</strong> —
              {{ preview.pack.skills.length }} навыков, {{ preview.competencyCount }} компетенций,
              уровни {{ preview.grades.join(', ') }}.
            </span>
          </div>

          <button
            type="button"
            :disabled="!preview?.ok || busy"
            class="min-h-11 w-full inline-flex items-center justify-center gap-2 rounded-lg
                   bg-(--accent) text-white text-xs font-semibold cursor-pointer transition-opacity
                   hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="doImport"
          >
            Добавить матрицу
          </button>
        </section>
      </TabsContent>
    </TabsRoot>
  </AppDialog>
</template>
