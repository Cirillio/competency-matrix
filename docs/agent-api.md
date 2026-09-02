# API для ИИ-агентов

Edge Function `agent-context` даёт агенту доступ к матрице и прогрессу владельца
одним HTTP-запросом.

Базовый URL: `https://xxoedworntkuotafqlih.supabase.co/functions/v1/agent-context`

## GET /matrix — публично, без токена

Возвращает встроенную матрицу компетенций (139 навыков):
`{ "skills": [{ id, competencyId, competencyName, grade, requirement, title, topics }] }`

Данные читаются из таблицы `public.builtin_skills` (публичный SELECT). Её также
можно опрашивать напрямую через PostgREST:
`GET {SUPABASE_URL}/rest/v1/builtin_skills?select=*&order=sort.asc` с заголовком `apikey`.

## GET / — по токену

Заголовок `Authorization: Bearer cmx_…`. Токен создаётся в приложении
(меню → «Доступ для ИИ-агентов»); в базе хранится только его SHA-256-хэш.

Ответ:
```
{
  "profile": "<свободный текст из настроек>",
  "level": {
    "current", "target", "autoTarget", "targetIsManual",
    "certified": [...], "progressToTargetPercent", "matrixCoveragePercent"
  },
  "completedSkillIds": [...],
  "gapSkills": [{ id, grade, competency, title, topics }],
  "skillCount": 139
}
```

Учитываются включённые пользовательские наборы (`matrix_packs`): их навыки
добавляются в расчёт уровня.

Ошибки: `401 missing_token`, `401 invalid_token`.

## v1 — только чтение

Запись (закрытие навыка после мок-интервью) — фаза 2.

## Синхронизация builtin_skills

`src/data/matrix.json` — источник правды. При его изменении пересоздать строки
`public.builtin_skills` (миграция `create_and_seed_builtin_skills` + генератор SQL
из полей id, competencyId, competencyName, grade, requirement, title, topics, description).
