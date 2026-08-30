import { ref, readonly } from 'vue';

export type ToastTone = 'neutral' | 'critical' | 'success';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

// Module-level queue: one shared toast surface for the whole app.
const items = ref<ToastItem[]>([]);
let nextId = 0;

export function useToast() {
  function push(title: string, options: { description?: string; tone?: ToastTone } = {}) {
    const id = nextId++;
    items.value = [...items.value, { id, title, description: options.description, tone: options.tone ?? 'neutral' }];
    return id;
  }

  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id);
  }

  return {
    items: readonly(items),
    push,
    dismiss,
    notify: (title: string, description?: string) => push(title, { description }),
    error: (title: string, description?: string) => push(title, { description, tone: 'critical' }),
    success: (title: string, description?: string) => push(title, { description, tone: 'success' }),
  };
}
