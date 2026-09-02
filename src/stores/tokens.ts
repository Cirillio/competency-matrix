import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TokensService, type ApiToken } from '../services/tokens/TokensService';

export const useTokensStore = defineStore('tokens', () => {
  const tokens = ref<ApiToken[]>([]);
  const isLoaded = ref(false);

  async function load() {
    tokens.value = await TokensService.list();
    isLoaded.value = true;
  }

  function reset() {
    tokens.value = [];
    isLoaded.value = false;
  }

  /** Returns the raw token string (shown once) or null when signed out. */
  async function create(name: string): Promise<string | null> {
    const created = await TokensService.create(name.trim() || 'Без названия');
    if (!created) return null;
    tokens.value = [created.record, ...tokens.value];
    return created.token;
  }

  async function revoke(tokenHash: string) {
    await TokensService.revoke(tokenHash);
    const t = tokens.value.find((x) => x.tokenHash === tokenHash);
    if (t) t.revoked = true;
  }

  async function remove(tokenHash: string) {
    const snapshot = tokens.value;
    tokens.value = tokens.value.filter((x) => x.tokenHash !== tokenHash);
    try {
      await TokensService.remove(tokenHash);
    } catch {
      tokens.value = snapshot;
    }
  }

  return { tokens, isLoaded, load, reset, create, revoke, remove };
});
