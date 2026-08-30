<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useProgressStore } from '../../stores/progress';
import { buildAiContext } from '../../utils/aiContext';
import { useToast } from '../../composables/useToast';
import AppDialog from '../common/AppDialog.vue';
import { PhCopy, PhCheck } from '@phosphor-icons/vue';

const open = defineModel<boolean>('open', { default: false });

const progressStore = useProgressStore();
const toast = useToast();

const profileDraft = ref(progressStore.userProgress.profile ?? '');
const copied = ref(false);

// Re-seed the draft each time the dialog opens, so remote sync isn't overwritten.
watch(open, (isOpen) => {
  if (isOpen) {
    profileDraft.value = progressStore.userProgress.profile ?? '';
    copied.value = false;
  } else {
    persistProfile();
  }
});

function persistProfile() {
  if ((progressStore.userProgress.profile ?? '') !== profileDraft.value) {
    progressStore.setProfile(profileDraft.value);
  }
}

const prompt = computed(() =>
  buildAiContext({ evaluation: progressStore.evaluation, profile: profileDraft.value })
);

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(prompt.value);
    persistProfile();
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    toast.error('Не удалось скопировать', 'Буфер обмена недоступен');
  }
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    size="lg"
    title="Контекст для ИИ"
    description="Промпт для мок-интервью: профиль, положение на матрице и рамки, удерживающие разговор от викторины."
  >
    <div class="space-y-5">
      <div class="space-y-2">
        <label for="ai-profile" class="block text-xs text-(--text-secondary)">
          Профиль — опыт, стек, ближайшая цель
        </label>
        <textarea
          id="ai-profile"
          v-model="profileDraft"
          rows="3"
          placeholder="Например: прошёл стажировку фронтендером, писал на React и Angular, жду оффер на джуна."
          class="w-full resize-y rounded-lg bg-(--surface-1) p-3 text-xs text-(--text-primary)
                 placeholder-(--text-tertiary) focus:outline-none focus:ring-1 focus:ring-(--accent)"
        />
        <p class="text-[11px] text-(--text-tertiary)">
          Без него модель считает по матрице, что вы не знаете ничего, и уводит разговор на азы.
        </p>
      </div>

      <div class="space-y-2">
        <span class="block text-[10px] font-mono uppercase tracking-[0.14em] text-(--text-tertiary)">
          Промпт
        </span>
        <pre
          class="max-h-72 overflow-auto rounded-lg bg-(--surface-1) p-3 text-[11px] leading-relaxed
                 text-(--text-secondary) whitespace-pre-wrap"
        >{{ prompt }}</pre>
      </div>

      <button
        type="button"
        class="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-lg
               bg-(--accent) text-white text-xs font-semibold cursor-pointer
               transition-opacity hover:opacity-90
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        @click="copyPrompt"
      >
        <PhCheck v-if="copied" :size="16" weight="bold" />
        <PhCopy v-else :size="16" />
        <span>{{ copied ? 'Скопировано' : 'Скопировать промпт' }}</span>
      </button>
    </div>
  </AppDialog>
</template>
