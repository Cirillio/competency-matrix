import { ORDERED_GRADES } from '../types/matrix';

/**
 * Human-readable, example-driven spec of the competency-matrix JSON, shown in
 * the import dialog and offered as a downloadable template. Mirrors
 * `matrixPackSchema` in src/types/matrixPack.ts — keep the two in sync.
 */

export interface FieldSpec {
  path: string;
  type: string;
  required: boolean;
  note: string;
  example: string;
}

export const PACK_FIELDS: FieldSpec[] = [
  { path: 'name', type: 'string', required: true, note: 'Как набор называется в списке матриц', example: '"Бэкенд-основы"' },
  { path: 'version', type: 'string', required: false, note: 'Ваша версия набора, по умолчанию "1.0.0"', example: '"1.0.0"' },
  { path: 'skills[]', type: 'object[]', required: true, note: 'Минимум один навык', example: '[ … ]' },
  { path: 'skills[].id', type: 'string', required: true, note: 'Уникальный во всей матрице (встроенной + других наборах). kebab-case', example: '"node-e2.1-event-loop"' },
  { path: 'skills[].competencyId', type: 'string', required: true, note: 'Группирует навыки в одну компетенцию', example: '"node"' },
  { path: 'skills[].competencyName', type: 'string', required: true, note: 'Заголовок компетенции в списке', example: '"Node.js"' },
  { path: 'skills[].category', type: 'string', required: true, note: 'Верхнеуровневая категория', example: '"Тех. скилы"' },
  { path: 'skills[].section', type: 'string', required: true, note: 'Раздел — попадает в фильтр «Раздел»', example: '"Серверные технологии"' },
  { path: 'skills[].grade', type: ORDERED_GRADES.map((g) => `"${g}"`).join(' | '), required: true, note: 'Один из 10 уровней. Влияет на расчёт грейда', example: '"E2.1"' },
  { path: 'skills[].requirement', type: '"mandatory" | "desirable" | "additional" | "optional"', required: true, note: 'mandatory — нужно 100% для уровня; desirable — ≥70%; additional / optional — не влияют на грейд, идут в «Дополнительно»', example: '"mandatory"' },
  { path: 'skills[].title', type: 'string', required: true, note: 'Название навыка', example: '"Событийный цикл Node.js"' },
  { path: 'skills[].description', type: 'string', required: true, note: 'Описание. Можно пустую строку ""', example: '"Порядок фаз, микротаски, отличие от браузера"' },
  { path: 'skills[].topics', type: 'string[]', required: true, note: 'Ключевые подтемы. Можно []', example: '["libuv", "phases", "microtasks"]' },
  { path: 'skills[].links', type: '{ title: string, url: string }[]', required: true, note: 'Материалы. Можно []', example: '[{ "title": "Node.js docs", "url": "https://nodejs.org/api/" }]' },
];

/** A complete, valid file — used verbatim as the downloadable template. */
export const PACK_TEMPLATE = {
  name: 'Бэкенд-основы',
  version: '1.0.0',
  skills: [
    {
      id: 'node-e2.1-event-loop',
      competencyId: 'node',
      competencyName: 'Node.js',
      category: 'Тех. скилы',
      section: 'Серверные технологии',
      grade: 'E2.1',
      requirement: 'mandatory',
      title: 'Событийный цикл Node.js',
      description: 'Порядок фаз event loop, микротаски, отличия от браузера.',
      topics: ['libuv', 'phases', 'process.nextTick', 'microtasks'],
      links: [{ title: 'Node.js — The event loop', url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick' }],
    },
    {
      id: 'node-e2.2-streams',
      competencyId: 'node',
      competencyName: 'Node.js',
      category: 'Тех. скилы',
      section: 'Серверные технологии',
      grade: 'E2.2',
      requirement: 'desirable',
      title: 'Потоки и backpressure',
      description: 'Readable/Writable/Transform, режим объектов, обработка backpressure.',
      topics: ['Readable', 'Writable', 'pipeline()', 'backpressure'],
      links: [],
    },
  ],
} as const;

/** Pretty JSON of the template, ready to render in a code block. */
export const PACK_TEMPLATE_JSON = JSON.stringify(PACK_TEMPLATE, null, 2);
