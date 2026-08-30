# Матрица компетенций Frontend-инженера

Интерактивный трекер матрицы компетенций Frontend-разработчика с алгоритмическим расчётом грейда и синхронизацией через Supabase.

---

## Возможности

- **Каталог 139 навыков:** 10 грейдов (`E1.1`–`E5.2`), темы, подтемы, официальные ссылки на документацию.
- **Алгоритмический грейдинг:** Автоматический расчёт текущего подтверждённого грейда с непрерывной цепочкой сертификации (100% mandatory + $\ge 70\%$ desirable).
- **Выбираемая цель:** Выбор целевого уровня на интерактивной лестнице грейдов с автоматическим пересчётом всех промежуточных GAP-блокеров.
- **Интерактивные заметки:** Сохранение личных заметок к навыкам (переживают снятие отметки о сдаче).
- **Синхронизация прогресса:** Кросс-девайс синхронизация через Supabase с локальным кэшем и поддержкой оффлайн-режима.
- **Экспорт / Импорт:** Бэкап и восстановление прогресса в формате `.json` с Zod-валидацией схемы и санитизацией orphan-ключей.
- **AI Prompt Generator:** Генерация структурированного Markdown-контекста для LLM (Claude, Antigravity, Gemini).

---

## Архитектура и стек

- **Frontend:** Vue 3.5 (`<script setup lang="ts">`), Vite 6, TypeScript Strict.
- **State Management:** Pinia (разделение на `matrix`, `progress`, `filter`, `auth` сторы).
- **Headless UI:** `reka-ui` (доступность, WAI-ARIA, клавиатурное управление).
- **Стилизация:** Tailwind CSS v4 (CSS-first переменные, ступенчатая светлота `--surface-0` $\dots$ `--surface-3`).
- **Схемы и валидация:** `zod` (SSOT для структуры датасета и прогресса).
- **Тесты:** Vitest (TDD unit-тесты, Happy-DOM).

```text
src/
├── assets/          # CSS переменные темы и Tailwind v4
├── components/      # UI компоненты (common, matrix, progress)
├── composables/     # useSkillFilter.ts
├── config/          # app.ts, grades.ts
├── data/            # matrix.json (139 навыков)
├── layout/          # MainLayout.vue, Header.vue
├── services/        # Storage (LocalStorage, Memory, Supabase, Syncing) & Export
├── stores/          # Pinia stores (matrix, progress, filter, auth)
├── types/           # Zod schemas & TypeScript contracts
└── utils/           # Pure gradeEvaluator.ts
```

---

## Разработка и верификация

```bash
# Установка зависимостей
bun install

# Запуск dev-сервера
bun run dev

# Единая проверка перед коммитом (Typecheck + Lint + Tests)
bun run verify

# Сборка production-бандла
bun run build
```

---

## Дорожная карта развития

- [x] **Фаза 1:** Веб-приложение, алгоритмический расчёт грейда, выбор цели, синхронизация Supabase, строгий редакторский UI.
- [ ] **Фаза 2 (Планируется):** 
  - Нативное десктопное приложение через **Tauri v2**.
  - Встроенный локальный **MCP-сервер** для интеграции с AI-ассистентами (автоматическое интервью и проставление отметок).
