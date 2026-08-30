<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useAuthStore } from '../stores/auth';
import { JsonExportImportService } from '../services/export/JsonExportImportService';
import { APP_NAME_SHORT } from '../config/app';
import Button from '../components/common/Button.vue';
import { Download, Upload, RotateCcw, Check, Sparkles, AlertCircle, LogOut } from 'lucide-vue-next';

const progressStore = useProgressStore();
const authStore = useAuthStore();
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef');
const copiedAiContext = ref(false);
const statusMessage = ref<string | null>(null);

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
    if (result.skippedOrphanCount > 0) {
      statusMessage.value = `Импортировано (пропущено ${result.skippedOrphanCount} устаревших записей)`;
      setTimeout(() => { statusMessage.value = null; }, 4000);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ошибка импорта';
    alert(message);
  } finally {
    target.value = '';
  }
}

async function handleReset() {
  if (confirm('Сбросить весь прогресс матрицы?')) {
    await progressStore.resetProgress();
  }
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

  await navigator.clipboard.writeText(text);
  copiedAiContext.value = true;
  setTimeout(() => {
    copiedAiContext.value = false;
  }, 2000);
}

async function handleSignOut() {
  if (confirm('Выйти из аккаунта?')) {
    await authStore.signOut();
  }
}
</script>

<template>
  <header class="bg-[var(--surface-1)] sticky top-0 z-30 px-6 py-3">
    <div class="max-w-[1160px] mx-auto flex items-center justify-between gap-4">
      <!-- Wordmark -->
      <div class="flex items-center gap-2.5">
        <span class="text-sm font-bold tracking-tight text-[var(--text-primary)] font-mono">
          {{ APP_NAME_SHORT }}
        </span>
        <span class="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
          v2.0
        </span>
        <!-- Storage error indicator -->
        <span
          v-if="progressStore.lastSaveError"
          class="text-[11px] text-[var(--critical)] flex items-center gap-1 font-mono"
          :title="progressStore.lastSaveError"
        >
          <AlertCircle class="w-3.5 h-3.5" />
          <span>Ошибка сохранения</span>
        </span>
        <!-- Import status message -->
        <span
          v-if="statusMessage"
          class="text-[11px] text-[var(--text-secondary)] font-mono"
        >
          {{ statusMessage }}
        </span>
      </div>

      <!-- Action Icons with tooltips -->
      <div class="flex items-center gap-1.5">
        <!-- Copy AI Context -->
        <Button
          variant="ghost"
          size="icon"
          :title="copiedAiContext ? 'Контекст скопирован!' : 'Скопировать контекст для ИИ'"
          aria-label="Скопировать контекст для ИИ"
          @click="handleCopyAiContext"
        >
          <component
            :is="copiedAiContext ? Check : Sparkles"
            :class="['w-4 h-4', copiedAiContext ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]']"
          />
        </Button>

        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileSelected"
        >

        <!-- Export -->
        <Button
          variant="ghost"
          size="icon"
          title="Экспорт прогресса в JSON"
          aria-label="Экспорт прогресса в JSON"
          @click="handleExport"
        >
          <Download class="w-4 h-4 text-[var(--text-secondary)]" />
        </Button>

        <!-- Import -->
        <Button
          variant="ghost"
          size="icon"
          title="Импорт прогресса из JSON"
          aria-label="Импорт прогресса из JSON"
          @click="handleImportClick"
        >
          <Upload class="w-4 h-4 text-[var(--text-secondary)]" />
        </Button>

        <!-- Reset -->
        <Button
          variant="ghost"
          size="icon"
          title="Сбросить отметки"
          aria-label="Сбросить отметки"
          @click="handleReset"
        >
          <RotateCcw class="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--critical)]" />
        </Button>

        <!-- Logout -->
        <Button
          v-if="authStore.status === 'authed'"
          variant="ghost"
          size="icon"
          title="Выйти из системы"
          aria-label="Выйти из системы"
          @click="handleSignOut"
        >
          <LogOut class="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--critical)]" />
        </Button>
      </div>
    </div>
  </header>
</template>
