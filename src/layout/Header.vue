<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useAuthStore } from '../stores/auth';
import { JsonExportImportService } from '../services/export/JsonExportImportService';
import { APP_NAME_SHORT } from '../config/app';
import { useToast } from '../composables/useToast';
import AppTooltip from '../components/common/AppTooltip.vue';
import AppDropdown from '../components/common/AppDropdown.vue';
import AppDropdownItem from '../components/common/AppDropdownItem.vue';
import AppAlertDialog from '../components/common/AppAlertDialog.vue';
import {
  PhDownloadSimple, PhUploadSimple, PhArrowCounterClockwise,
  PhCheck, PhSparkle, PhSignOut, PhDotsThree,
} from '@phosphor-icons/vue';

const progressStore = useProgressStore();
const authStore = useAuthStore();
const toast = useToast();

const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef');
const copiedAiContext = ref(false);
const resetDialogOpen = ref(false);
const signOutDialogOpen = ref(false);

// Surface storage failures as a toast instead of a silent header badge.
watch(
  () => progressStore.lastSaveError,
  (error) => {
    if (error) toast.error('Прогресс не сохранён', error);
  }
);

function handleExport() {
  JsonExportImportService.exportProgress(progressStore.userProgress);
}

function handleImportClick() {
  fileInputRef.value?.click();
}

async function handleFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const result = await JsonExportImportService.importProgress(file);
    await progressStore.importProgress(result.data);
    toast.success(
      'Прогресс импортирован',
      result.skippedOrphanCount > 0
        ? `Пропущено устаревших записей: ${result.skippedOrphanCount}`
        : undefined
    );
  } catch (err: unknown) {
    toast.error('Импорт не удался', err instanceof Error ? err.message : 'Ошибка импорта');
  } finally {
    target.value = '';
  }
}

async function handleReset() {
  await progressStore.resetProgress();
  toast.notify('Прогресс сброшен');
}

async function handleCopyAiContext() {
  const evalResult = progressStore.evaluation;
  const target = evalResult.targetGrade || 'E5.2';

  const gapList = evalResult.gapSkills
    .map((s) => `- [${s.grade}] ${s.competencyName}: **${s.title}** (${s.topics.join(', ')})`)
    .join('\n');

  const text = `# Контекст компетенций фронтенд-разработчика

- **Текущий подтвержденный грейд:** ${evalResult.currentGrade}
- **Целевой грейд:** ${target}
- **Прогресс до целевого грейда:** ${evalResult.targetGradeProgressPercent}%
- **Общий охват матрицы:** ${evalResult.matrixProgressPercent}%

## Критические блокеры перехода (GAP-навыки):
${gapList || 'Все обязательные навыки закрыты!'}

Используй этот контекст для проведения mock-интервью и разбора пробелов.`;

  try {
    await navigator.clipboard.writeText(text);
    copiedAiContext.value = true;
    setTimeout(() => { copiedAiContext.value = false; }, 2000);
  } catch {
    toast.error('Не удалось скопировать', 'Буфер обмена недоступен');
  }
}
</script>

<template>
  <!-- Same ground as the page: content slides under it without a visible slab edge. -->
  <header class="bg-(--surface-0) sticky top-0 z-30 px-4 sm:px-6">
    <div class="max-w-[1320px] mx-auto h-14 flex items-center justify-between gap-4">
      <!-- Wordmark: name carries the weight, qualifier stays quiet -->
      <h1 class="flex items-baseline gap-1.5 select-none">
        <span class="text-[15px] font-semibold tracking-[-0.01em] text-(--text-primary)">
          {{ APP_NAME_SHORT }}
        </span>
        <span class="hidden sm:inline text-[13px] font-normal text-(--text-tertiary)">
          компетенций
        </span>
      </h1>

      <div class="flex items-center gap-0.5">
        <!-- Frequent action stays visible; the rest lives in the menu. -->
        <AppTooltip :label="copiedAiContext ? 'Скопировано' : 'Контекст для ИИ'">
          <button
            type="button"
            aria-label="Скопировать контекст для ИИ"
            class="w-10 h-10 inline-flex items-center justify-center rounded-full cursor-pointer
                   transition-colors hover:bg-(--surface-2)
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="handleCopyAiContext"
          >
            <PhCheck v-if="copiedAiContext" :size="18" weight="bold" class="text-(--success)" />
            <PhSparkle v-else :size="18" class="text-(--text-secondary)" />
          </button>
        </AppTooltip>

        <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileSelected">

        <AppDropdown>
          <template #trigger>
            <button
              type="button"
              aria-label="Меню действий"
              class="w-10 h-10 inline-flex items-center justify-center rounded-full cursor-pointer
                     transition-colors hover:bg-(--surface-2)
                     data-[state=open]:bg-(--surface-2)
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <PhDotsThree :size="20" weight="bold" class="text-(--text-secondary)" />
            </button>
          </template>

          <AppDropdownItem @select="handleExport">
            <PhDownloadSimple :size="16" class="shrink-0" />
            <span>Экспорт прогресса</span>
          </AppDropdownItem>

          <AppDropdownItem @select="handleImportClick">
            <PhUploadSimple :size="16" class="shrink-0" />
            <span>Импорт из файла</span>
          </AppDropdownItem>

          <AppDropdownItem tone="critical" @select="resetDialogOpen = true">
            <PhArrowCounterClockwise :size="16" class="shrink-0" />
            <span>Сбросить прогресс</span>
          </AppDropdownItem>

          <AppDropdownItem
            v-if="authStore.status === 'authed'"
            tone="critical"
            @select="signOutDialogOpen = true"
          >
            <PhSignOut :size="16" class="shrink-0" />
            <span>Выйти из аккаунта</span>
          </AppDropdownItem>
        </AppDropdown>
      </div>
    </div>

    <AppAlertDialog
      v-model:open="resetDialogOpen"
      title="Сбросить весь прогресс?"
      description="Все отметки и заметки будут удалены. Действие необратимо."
      confirm-label="Сбросить"
      @confirm="handleReset"
    />

    <AppAlertDialog
      v-model:open="signOutDialogOpen"
      title="Выйти из аккаунта?"
      description="Локальные данные на этом устройстве будут очищены. Прогресс останется в облаке."
      confirm-label="Выйти"
      @confirm="authStore.signOut()"
    />
  </header>
</template>
