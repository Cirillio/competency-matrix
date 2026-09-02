<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useTokensStore } from '../../stores/tokens';
import { useToast } from '../../composables/useToast';
import AppDialog from '../common/AppDialog.vue';
import { PhTrash, PhCopy, PhCheck } from '@phosphor-icons/vue';

const open = defineModel<boolean>('open', { default: false });

const tokensStore = useTokensStore();
const toast = useToast();

const newName = ref('');
const busy = ref(false);
/** The freshly created raw token — shown once, then cleared. */
const revealed = ref<string | null>(null);
const copied = ref(false);

const ENDPOINT = 'https://xxoedworntkuotafqlih.supabase.co/functions/v1/agent-context';

const curlExample = computed(
  () => `curl -s "${ENDPOINT}/" \\\n  -H "Authorization: Bearer ${revealed.value ?? 'cmx_…'}"`
);

watch(open, (isOpen) => {
  if (isOpen) {
    revealed.value = null;
    newName.value = '';
    if (!tokensStore.isLoaded) tokensStore.load();
  }
});

async function createToken() {
  if (busy.value) return;
  busy.value = true;
  try {
    const token = await tokensStore.create(newName.value);
    if (!token) {
      toast.error('Нужно войти в аккаунт');
      return;
    }
    revealed.value = token;
    newName.value = '';
  } catch (err) {
    toast.error('Не удалось создать токен', err instanceof Error ? err.message : undefined);
  } finally {
    busy.value = false;
  }
}

async function copyToken() {
  if (!revealed.value) return;
  try {
    await navigator.clipboard.writeText(revealed.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    toast.error('Буфер обмена недоступен');
  }
}

async function onRevoke(hash: string) {
  await tokensStore.revoke(hash);
  toast.notify('Токен отозван');
}

async function onDelete(hash: string) {
  await tokensStore.remove(hash);
  toast.notify('Токен удалён');
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('ru-RU') : '—';
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    size="lg"
    title="Доступ для ИИ-агентов"
    description="Токен даёт агенту доступ на чтение вашего прогресса и матрицы через один HTTP-запрос."
  >
    <div class="space-y-6">
      <!-- New token -->
      <div class="space-y-2">
        <label for="token-name" class="text-xs text-(--text-secondary)">Название нового токена</label>
        <div class="flex gap-2">
          <input
            id="token-name"
            v-model="newName"
            type="text"
            placeholder="например, Claude Desktop"
            class="flex-1 min-h-10 rounded-lg bg-(--surface-1) px-3 text-xs text-(--text-primary)
                   placeholder-(--text-tertiary) focus:outline-none focus:ring-1 focus:ring-(--accent)"
            @keydown.enter="createToken"
          >
          <button
            type="button"
            :disabled="busy"
            class="min-h-10 px-4 rounded-lg bg-(--accent) text-white text-xs font-semibold cursor-pointer
                   transition-opacity hover:opacity-90 disabled:opacity-40
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="createToken"
          >
            Создать
          </button>
        </div>
      </div>

      <!-- Reveal (once) -->
      <div v-if="revealed" class="rounded-xl bg-(--surface-1) p-4 space-y-3">
        <p class="text-[11px] text-(--text-secondary)">
          Скопируйте токен сейчас — он показывается один раз и в базе не хранится.
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 min-w-0 truncate rounded-lg bg-(--surface-0) px-3 py-2 text-[11px] font-mono text-(--text-primary)">
            {{ revealed }}
          </code>
          <button
            type="button"
            aria-label="Скопировать токен"
            class="shrink-0 p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary)
                   hover:bg-(--surface-3) cursor-pointer transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="copyToken"
          >
            <PhCheck v-if="copied" :size="15" weight="bold" class="text-(--success)" />
            <PhCopy v-else :size="15" />
          </button>
        </div>
        <pre class="overflow-x-auto rounded-lg bg-(--surface-0) p-3 text-[11px] font-mono text-(--text-tertiary)">{{ curlExample }}</pre>
      </div>

      <!-- Existing tokens -->
      <div v-if="tokensStore.tokens.length > 0" class="space-y-2">
        <div
          v-for="t in tokensStore.tokens"
          :key="t.tokenHash"
          class="flex items-center gap-3 rounded-xl bg-(--surface-1) px-3.5 py-3"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm text-(--text-primary) truncate">
              {{ t.name }}
              <span v-if="t.revoked" class="ml-1.5 text-[10px] text-(--critical)">отозван</span>
            </div>
            <div class="text-[11px] font-mono text-(--text-tertiary)">
              создан {{ fmt(t.createdAt) }} · последнее использование {{ fmt(t.lastUsedAt) }}
            </div>
          </div>
          <button
            v-if="!t.revoked"
            type="button"
            class="shrink-0 text-[11px] text-(--text-tertiary) hover:text-(--critical) cursor-pointer
                   transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="onRevoke(t.tokenHash)"
          >
            Отозвать
          </button>
          <button
            type="button"
            :aria-label="`Удалить токен ${t.name}`"
            class="shrink-0 p-2 rounded-lg text-(--text-tertiary) hover:text-(--critical)
                   hover:bg-(--surface-3) cursor-pointer transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            @click="onDelete(t.tokenHash)"
          >
            <PhTrash :size="14" />
          </button>
        </div>
      </div>

      <p class="text-[11px] text-(--text-tertiary)">
        Публичный список компетенций доступен без токена:
        <code class="font-mono">GET {{ ENDPOINT }}/matrix</code>
      </p>
    </div>
  </AppDialog>
</template>
