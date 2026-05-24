# ТЗ: Сборка MVP Click&Speak
**Репозиторий:** https://github.com/solomonczyk/Click-Speak  
**Целевой URL:** https://click-speak.vercel.app  
**Стек:** Next.js 15 · React 19 · TypeScript · Tailwind · Dexie · Zustand · Zod  
**Статус:** документация готова, **код не написан**

---

## ПОЧЕМУ ДЕПЛОЙ НЕ РАБОТАЕТ

Vercel пытается задеплоить `apps/web`, но там нет ни одной страницы — только пустой scaffold (или вообще ничего). Нужно полностью написать приложение согласно документации в `docs/`.

**Источники правды (читать перед кодом):**
- `docs/01-product-vision-prd.md` — что строим и зачем
- `docs/02-ux-ui-spec.md` — IA, маршруты, компоненты, wireframes
- `docs/03-architecture.md` — стек, структура папок, паттерны
- `docs/04-data-model.md` — схема Dexie, SRS-поля
- `docs/05-api-spec.md` — BFF routes `/api/enrich` и `/api/tts`
- `docs/07-acceptance-criteria.md` — критерии приёмки по каждой фиче
- `stitch_linguo_vocab_flashcards/` — HTML-мокапы, открыть в браузере

---

## НАСТРОЙКА ПРОЕКТА (сделать первым делом)

### 1. Vercel — Root Directory

В настройках Vercel проекта убедиться:
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (или оставить по умолчанию)

### 2. Создать `apps/web/package.json` с зависимостями

```json
{
  "name": "click-speak-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.7",
    "zustand": "^5.0.0",
    "zod": "^3.23.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10",
    "postcss": "^8",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4"
  }
}
```

### 3. Переменные окружения в Vercel

Добавить в Vercel Dashboard → Settings → Environment Variables:

```
DEEPL_API_KEY=           # DeepL Free или Pro — для перевода
AZURE_TTS_KEY=           # Azure Cognitive Services
AZURE_TTS_REGION=        # например: westeurope
DICTIONARY_API_KEY=      # Free Dictionary API (можно без ключа)
```

**Важно:** если ключей нет на старте — реализовать fallback на Free Dictionary API (без ключа) и Web Speech API для TTS. Приложение должно работать хотя бы частично без внешних ключей.

### 4. Целевая структура `apps/web/`

```
apps/web/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx          # AppShell с навигацией
│   │   ├── page.tsx            # Dashboard /
│   │   ├── learn/page.tsx      # Режим обучения
│   │   ├── decks/
│   │   │   ├── page.tsx        # Список колод
│   │   │   └── [deckId]/
│   │   │       ├── page.tsx    # Детали колоды + карточки
│   │   │       └── edit/page.tsx
│   │   ├── statistics/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── enrich/route.ts     # BFF: словарь + перевод
│   │   └── tts/route.ts        # BFF: синтез речи
│   ├── globals.css
│   └── layout.tsx              # Root layout + fonts
├── components/
│   ├── ui/                     # Примитивы
│   └── features/               # Доменные компоненты
├── features/
│   ├── decks/
│   ├── cards/
│   ├── learn/
│   ├── quick-add/
│   └── statistics/
├── lib/
│   ├── db/                     # Dexie schema + репозитории
│   ├── srs/                    # Алгоритм SM-2
│   ├── enrichment/             # Провайдеры
│   └── audio/
├── stores/                     # Zustand stores
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ФАЗА 1: ФУНДАМЕНТ (деплой работает, виден UI)

### 1.1 База данных — `lib/db/`

Создать Dexie-схему согласно `docs/04-data-model.md`. Минимальные таблицы:

```ts
// lib/db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Deck {
  id?: number;
  name: string;
  description?: string;
  sourceLang: string;   // ISO 639-1, например 'en'
  targetLang: string;   // например 'ru'
  createdAt: Date;
  updatedAt: Date;
  lastStudiedAt?: Date;
}

export interface Card {
  id?: number;
  deckId: number;
  term: string;
  translation: string;
  exampleTarget?: string;
  exampleNative?: string;
  partOfSpeech?: string;
  phonetic?: string;
  cefrLevel?: string;
  notes?: string;
  audioUrl?: string;
  // SRS fields
  interval: number;       // дней до следующего повторения
  easeFactor: number;     // множитель лёгкости (начало: 2.5)
  repetitions: number;    // кол-во успешных повторений
  dueAt: Date;            // когда следующий показ
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyStats {
  id?: number;
  date: string;           // 'YYYY-MM-DD'
  reviewed: number;
  newCards: number;
  timeSpentSeconds: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export class ClickSpeakDB extends Dexie {
  decks!: Table<Deck>;
  cards!: Table<Card>;
  dailyStats!: Table<DailyStats>;
  settings!: Table<Settings>;

  constructor() {
    super('ClickSpeakDB');
    this.version(1).stores({
      decks: '++id, name, lastStudiedAt',
      cards: '++id, deckId, term, dueAt',
      dailyStats: '++id, &date',
      settings: '++id, &key',
    });
  }
}

export const db = new ClickSpeakDB();
```

Создать репозитории: `deckRepo.ts`, `cardRepo.ts`, `statsRepo.ts` с методами CRUD.

### 1.2 SRS Engine — `lib/srs/`

Реализовать упрощённый SM-2. Чистая функция без React:

```ts
// lib/srs/algorithm.ts
export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SRSResult {
  interval: number;     // дней
  easeFactor: number;
  repetitions: number;
  dueAt: Date;
  nextIntervalLabel: string;  // '10 мин', '1 день', '4 дня' — для UI
}

export function applyGrade(card: Pick<Card, 'interval'|'easeFactor'|'repetitions'>, grade: Grade): SRSResult {
  // Again → interval=0 (повторить через 10 мин)
  // Hard → interval * 1.2
  // Good → стандартный SM-2
  // Easy → interval * 1.3 * easeFactor
  // ...
}
```

**Обязательно:** 100% юнит-тесты на эту функцию через Vitest.

### 1.3 AppShell и навигация

Создать `app/(main)/layout.tsx`:
- Desktop (≥1024px): sidebar 256px фиксированный, иконки + текст навигации
- Mobile (<768px): скрыть sidebar, добавить `<BottomNav>` с 4 пунктами
- Пункты: Dashboard (`/`), Learn (`/learn`), Decks (`/decks`), Statistics (`/statistics`)
- Settings — ссылка в низу sidebar на desktop, отдельный маршрут
- Quick Add FAB — глобальный, видим на всех экранах кроме `/learn`

**Дизайн-токены:** использовать цвета и шрифты из `stitch_linguo_vocab_flashcards/linguistic_clarity/DESIGN.md`. Открыть файл и имплементировать в `tailwind.config.ts`.

---

## ФАЗА 2: КОЛОДЫ И КАРТОЧКИ

### 2.1 Страница `/decks` — список колод

По мокапу `stitch_linguo_vocab_flashcards/my_decks/code.html`:

- Заголовок с кнопкой «Новая колода» и «Импортировать CSV»
- Таблица/список колод: название, языковая пара, кол-во карточек, mastery bar, дата последнего занятия, действия (редактировать, удалить)
- Строка поиска по названию
- Сортировка по имени / дате / mastery
- Пустое состояние: иллюстрация + «Создайте первую колоду»

### 2.2 Модальное окно «Новая колода»

Поля: название*, sourceLang (select ISO)*, targetLang (select ISO)*, описание.
Сохранить через `deckRepo.create()` → редирект на `/decks/[id]`.

### 2.3 Страница `/decks/[deckId]` — детали колоды

- Заголовок колоды + кнопки «Учить», «Quick Add», «Импорт CSV», «Редактировать»
- Список карточек: term | translation | dueAt | оценка (mastery) | действия
- Кнопка удаления карточки с подтверждением

### 2.4 Импорт CSV

Поддержать формат `term,translation,example` (example → `exampleTarget`).

1. Выбрать файл + целевую колоду
2. Показать preview первых 5 строк
3. На confirm: импортировать, дубликаты (same `term` в той же колоде) — пропустить, показать отчёт (N добавлено, M пропущено)

---

## ФАЗА 3: QUICK ADD И ENRICHMENT

### 3.1 BFF Route `/api/enrich`

```ts
// app/api/enrich/route.ts
// POST { term, sourceLang, targetLang }
// Параллельно: dictionary lookup + translate
// Ответ: CardDraft (все поля карточки кроме id/deckId)
// Timeout: 5s per provider, graceful partial response
```

**Провайдер словаря (MVP):** Free Dictionary API `https://api.dictionaryapi.dev/api/v2/entries/{lang}/{term}`
- Извлечь: phonetic, partOfSpeech, первый пример из definitions
- Fallback: если ошибка — вернуть только то что есть

**Провайдер перевода (MVP):** DeepL Free API (`DEEPL_API_KEY`)
- Fallback: LibreTranslate (бесплатный, self-hosted или публичный endpoint) если DeepL недоступен

**Схема ответа (Zod):**
```ts
const CardDraftSchema = z.object({
  term: z.string(),
  translation: z.string(),
  exampleTarget: z.string().optional(),
  partOfSpeech: z.string().optional(),
  phonetic: z.string().optional(),
  cefrLevel: z.string().optional(),
});
```

### 3.2 BFF Route `/api/tts`

```ts
// app/api/tts/route.ts
// GET ?text=&lang=&voice=
// Ответ: audio/mpeg blob или { url: string }
```

**Провайдер (MVP):** Azure Cognitive Services TTS (`AZURE_TTS_KEY`, `AZURE_TTS_REGION`)
- Fallback: если ключа нет или ошибка — вернуть 204 No Content, клиент использует Web Speech API

### 3.3 QuickAddModal компонент

Триггеры: FAB (везде), кнопка на странице колоды, `Ctrl+K` на desktop.

**Состояния:**
1. `idle` — поле ввода слова + selector колоды
2. `loading` — skeleton card + spinner
3. `preview` — полная карточка, все поля редактируемые + кнопка ▶ для аудио
4. `partial_error` — жёлтый баннер, незаполненные поля подсвечены
5. `error` — красный баннер + кнопка «Повторить»

**При сохранении:** `cardRepo.create()` с initial SRS (interval=0, dueAt=now, easeFactor=2.5) → toast «Добавлено» + опционально «Начать учить».

**Кэш аудио:** сохранить blob в IndexedDB таблице `audioBlobs` с ключом `cardId`.

---

## ФАЗА 4: РЕЖИМ ОБУЧЕНИЯ

Страница `/learn` — самая важная.

### 4.1 Сборка очереди

```ts
// features/learn/learnService.ts
buildQueue({ deckId?, mode: 'review'|'new'|'all', shuffle: boolean })
// → карточки с dueAt <= now, sort by dueAt ASC
// Fisher-Yates shuffle если shuffle=true
```

### 4.2 Флипкарточка

По мокапу `stitch_linguo_vocab_flashcards/learning_mode/code.html`:

**Лицо (front):**
- Слово (term) большим шрифтом
- Фонетика если есть
- Кнопка ▶ аудио
- Кнопка «Нажмите, чтобы увидеть перевод» или клик/Space

**Оборот (back):**
- Перевод
- Пример предложения
- Часть речи / CEFR
- 4 кнопки SRS с метками интервала под каждой

**Анимация:** CSS 3D flip. При `prefers-reduced-motion` — просто fade.

### 4.3 Прогресс и хедер сессии

- Breadcrumb: «Название колоды / Режим»
- Progress bar: `current / total`
- Streak badge (дней)
- Кнопка Shuffle toggle
- Кнопка «Выйти» → ConfirmDialog («Прогресс сохранён, выйти?»)

### 4.4 Горячие клавиши (desktop)

`Space` → reveal, `1` → Again, `2` → Hard, `3` → Good, `4` → Easy, `Escape` → exit confirm.

### 4.5 Завершение сессии

Экран Summary: карточек повторено, Again N раз, время, кнопка «На главную».

### 4.6 Empty state

Нет due карточек → «На сегодня всё готово!» + предложение учить новые или другую колоду.

### 4.7 Запись статистики

После каждой оценки: `statsRepo.recordReview(card, grade, durationMs)` — обновить `DailyStats` текущего дня.

---

## ФАЗА 5: DASHBOARD

По мокапу `stitch_linguo_vocab_flashcards/linguist_dashboard/code.html`:

- **Hero блок:** «Готовы к занятию?» + CTA «Начать обучение» → `/learn`
- **Кольцо прогресса:** daily goal completion (% от цели слов в настройках)
- **Streak:** дней подряд с активностью
- **Счётчики:** слов повторено / цель на сегодня
- **Сетка колод:** до 6 карточек, сортировка по `lastStudiedAt`, кнопка «Учить»
- **Пустое состояние:** нет колод → «Создайте первую колоду» + CTA

**Убрать из мокапа (out of scope MVP):**
- Word of the Day
- Flash Streak Bonus / 2x XP
- «Pro Learner» label
- Иконки notifications / history в хедере

---

## ФАЗА 6: СТАТИСТИКА

По мокапу `stitch_linguo_vocab_flashcards/progress_statistics/code.html`:

- Weekly goal ring (кольцо прогресса)
- Daily activity bar chart (7 дней) — данные из `DailyStats`
- Счётчики: слов повторено, streak, время занятий, accuracy %

**Убрать из мокапа:**
- Download Report PDF
- Mastery Breakdown Grammar/Listening/Speaking
- «Linguistic Elite» badge
- Stories Read

---

## ФАЗА 7: НАСТРОЙКИ

Страница `/settings`, разделы:

1. Языки по умолчанию (native, learning) → используются в Quick Add
2. Daily goal: кол-во новых карточек и повторений
3. Shuffle в сессии: вкл/выкл по умолчанию
4. TTS Voice: если Azure поддерживает список — dropdown
5. Экспорт данных: JSON файл (все колоды + карточки + статистика)
6. Импорт данных: загрузить JSON → merge или replace
7. Очистить все данные: кнопка Danger + подтверждение

---

## КРИТИЧЕСКИЕ ТРЕБОВАНИЯ К КАЧЕСТВУ

### Нельзя нарушать:

1. **SRS никогда не теряется** при обновлении страницы — всё в IndexedDB, flush после каждой оценки
2. **API ключи только на server routes** — никогда не в `'use client'` компонентах
3. **Приложение работает offline** после первой загрузки — Quick Add требует сети, остальное нет
4. **Mobile first** — все touch targets минимум 44×44px, SRS-кнопки на весь экран в Learn
5. **Брендинг: Click&Speak**, не «Linguist» (как в мокапах Stitch)
6. **UI язык: русский** (таблица переводов в `docs/02-ux-ui-spec.md § 7`)

### Тесты (обязательны перед деплоем):

- Vitest unit tests для `lib/srs/algorithm.ts` — 100% branch coverage
- Виджет Learn: Space reveal, цифры 1-4, сохранение SRS после refresh

---

## ПОРЯДОК СБОРКИ (рекомендуемый)

```
Фаза 1  →  деплой: пустой AppShell с навигацией работает
Фаза 1  →  деплой: Dexie + SRS engine + тесты
Фаза 2  →  деплой: создание колод и карточек работает
Фаза 3  →  деплой: Quick Add работает (с fallback если нет API ключей)
Фаза 4  →  деплой: обучение работает E2E
Фаза 5  →  деплой: Dashboard с реальными данными
Фаза 6  →  деплой: Статистика
Фаза 7  →  деплой: Настройки + export/import
```

**После каждой фазы:** `git push` → Vercel собирает автоматически.

---

## ВАЖНЫЕ ЗАМЕЧАНИЯ ДЛЯ АГЕНТА

- **Читать `docs/` перед кодом** — там всё продумано, не изобретать заново
- **Мокапы в браузере** — открыть `stitch_linguo_vocab_flashcards/*.html` локально для pixel-ориентира
- **Monorepo**: `apps/web` — единственное приложение, `packages/` не нужны в MVP
- **No auth в MVP** — local-first, IndexedDB, без логина
- **Dexie** — не raw IndexedDB; использовать `useLiveQuery` для реактивных запросов в компонентах
- **Server Components** — только для layout shell; Learn, QuickAdd, Decks — всё `'use client'`
- Все компоненты из `docs/02-ux-ui-spec.md § 5` должны быть реализованы
