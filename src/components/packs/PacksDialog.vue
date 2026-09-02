<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { usePacksStore } from '../../stores/packs';
import { useMatrixStore } from '../../stores/matrix';
import { useToast } from '../../composables/useToast';
import { validatePack, type PackValidationResult } from '../../types/matrixPack';
import AppDialog from '../common/AppDialog.vue';
import AppSwitch from '../common/AppSwitch.vue';
import { PhTrash, PhUploadSimple, PhWarning } from '@phosphor-icons/vue';

const open = defineModel<boolean>('open', { default: false });

const packsStore = usePacksStore();
const matrixStore = useMatrixStore();
const toast = useToast();

const jsonText = ref('');
const busy = ref(false);

const placeholderExample = '{ "name": "Бэкенд-основы", "version": "1.0.0", "skills": [ … ] }';

watch(open, (isOpen) => {
  if (isOpen) {
    jsonText.value = '';
    if (!packsStore.isLoaded) packsStore.load();
  }
});

const builtInIds = computed(() => new Set(matrixStore.builtInSkills.map((s) => s.id)));

/** Live validation of the pasted JSON — drives the summary / error panel. */
const preview = computed<PackValidationResult | null>(() => {
  const text = jsonText.value.trim();
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, problems: ['Это не похоже на JSON — проверьте синтаксис'] };
  }
  const knownIds = new Set(builtInIds.value);
  for (const pack of packsStore.packs) {
    for (const s of pack.skills) knownIds.add(s.id);
  }
  return validatePack(parsed, knownIds);
});

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  jsonText.value = await file.text();
  (e.target as HTMLInputElement).value = '';
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
    const outcome = await packsStore.importPack(parsed, builtInIds.value);
    if (outcome.ok) {
      toast.success('Набор добавлен', outcome.packName);
      jsonText.value = '';
    } else {
      toast.error('Набор не добавлен', outcome.problems?.[0]);
    }
  } finally {
    busy.value = false;
  }
}

async function onDelete(id: string, name: string) {
  await packsStore.remove(id);
  toast.notify('Набор удалён', name);
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    size="lg"
    title="Наборы компетенций"
    description="Импортируйте свои компетенции из JSON. Включённые наборы добавляются к матрице и влияют на расчёт уровня."
  >
    <div class="space-y-6">
      <!-- Existing packs -->
      <div v-if="packsStore.packs.length > 0" class="space-y-2">
        <div
          v-for="pack in packsStore.packs"
          :key="pack.id"
          class="flex items-center gap-3 rounded-xl bg-(--surface-1) px-3.5 py-3"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm text-(--text-primary) truncate">{{ pack.name }}</div>
            <div class="text-[11px] font-mono text-(--text-tertiary)">
              {{ pack.skills.length }} навыков ·
              {{ new Set(pack.skills.map((s) => s.competencyId)).size }} компетенций · v{{ pack.version }}
            </div>
          </div>
          <AppSwitch
            :model-value="pack.enabled"
            :label="`Включить набор ${pack.name}`"
            @update:model-value="packsStore.toggle(pack.id)"
          />
          <button
            type="button"
            :aria-label="`Удалить набор ${pack.name}`"
            class="shrink-0 p-2 rounded-lg text-(--text-tertiary) hover:text-(--critical)
                   hover:bg-(--surface-3) cursor-pointer transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="onDelete(pack.id, pack.name)"
          >
            <PhTrash :size="15" />
          </button>
        </div>
      </div>

      <!-- Import -->
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <label for="pack-json" class="text-xs text-(--text-secondary)">
            JSON набора — вставьте текст или выберите файл
          </label>
          <label
            class="inline-flex items-center gap-1.5 text-[11px] text-(--accent) cursor-pointer hover:underline"
          >
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
          :placeholder="placeholderExample"
          class="w-full resize-y rounded-lg bg-(--surface-1) p-3 text-[11px] font-mono leading-relaxed
                 text-(--text-primary) placeholder-(--text-tertiary)
                 focus:outline-none focus:ring-1 focus:ring-(--accent)"
        />

        <!-- Validation feedback -->
        <div
          v-if="preview && !preview.ok"
          class="rounded-lg bg-(--critical-subtle) p-3 space-y-1"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-(--critical)">
            <PhWarning :size="14" />
            <span>Набор нельзя добавить</span>
          </div>
          <ul class="text-[11px] text-(--text-secondary) space-y-0.5 pl-5 list-disc">
            <li v-for="(p, i) in preview.problems" :key="i">{{ p }}</li>
          </ul>
        </div>

        <div
          v-else-if="preview && preview.ok"
          class="rounded-lg bg-(--surface-1) p-3 text-[11px] text-(--text-secondary)"
        >
          <strong class="text-(--text-primary)">{{ preview.pack.name }}</strong> —
          {{ preview.pack.skills.length }} навыков, {{ preview.competencyCount }} компетенций,
          уровни {{ preview.grades.join(', ') }}.
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
          Добавить набор
        </button>
      </div>
    </div>
  </AppDialog>
</template>
