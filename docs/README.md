# Click&Speak — проектная документация

**Версия документации:** 1.0.0  
**Дата:** 2026-05-23  
**Статус:** Черновик для разработки и приёмки MVP

Click&Speak — веб-приложение для изучения иностранной лексики через карточки с интервальным повторением, быстрым добавлением слов и качественной озвучкой.

Этот каталог — **единственный источник правды** для scope, UX, архитектуры, данных, API и критериев приёмки. При расхождении с UI-мокапами приоритет у документов с пометкой MVP; мокапы — визуальный референс.

---

## Навигация

| № | Документ | Описание |
|---|----------|----------|
| 01 | [Product Vision & PRD](./01-product-vision-prd.md) | Видение, ЦА, MVP, out of scope, метрики |
| 02 | [UX/UI Specification](./02-ux-ui-spec.md) | IA, экраны, потоки, responsive, a11y |
| 03 | [Architecture](./03-architecture.md) | Стек, модули, интеграции, потоки данных |
| 04 | [Data Model](./04-data-model.md) | Сущности, SRS, схемы, примеры JSON |
| 05 | [API Specification](./05-api-spec.md) | BFF, enrichment, Phase 2 REST |
| 06 | [Non-Functional Requirements](./06-non-functional.md) | Performance, security, i18n, браузеры |
| 07 | [Acceptance Criteria](./07-acceptance-criteria.md) | Given/When/Then, чеклисты приёмки |
| 08 | [Roadmap](./08-roadmap.md) | Фазы, риски, зависимости |
| — | [Design System](./design-system.md) | Токены, Tailwind mapping, компоненты |
| — | [Open Questions](./open-questions.md) | Нерешённые решения |

---

## UI-референсы (мокапы)

Прототипы Stitch лежат в [`../stitch_linguo_vocab_flashcards/`](../stitch_linguo_vocab_flashcards/):

| Экран | Путь |
|-------|------|
| Dashboard | `linguist_dashboard/code.html` |
| Decks | `my_decks/code.html` |
| Learn | `learning_mode/code.html` |
| Statistics | `progress_statistics/code.html` |
| Design tokens | `linguistic_clarity/DESIGN.md` |

В мокапах используется имя **Linguist** — в продукте отображается **Click&Speak**.

---

## Глоссарий

| Термин | Определение |
|--------|-------------|
| **Deck (колода)** | Набор карточек с общей языковой парой |
| **Card (карточка)** | Единица лексики: слово/фраза + перевод + пример + аудио |
| **Quick Add** | Добавление слова в одно поле с автоматическим обогащением |
| **SRS** | Spaced Repetition System — интервальное повторение |
| **Due** | Карточка, готовая к повторению (`dueAt <= now`) |
| **Review session** | Сессия повторения due-карточек |
| **Mastery** | Доля карточек в статусе `mastered` в колоде |
| **Enrichment** | Автозаполнение перевода, примера, POS, аудио |

---

## Порядок чтения

1. **PM / заказчик:** 01 → 07 → 08  
2. **Дизайнер:** 02 → design-system → мокапы  
3. **Разработчик:** 03 → 04 → 05 → 02 → 07  
4. **QA:** 07 → 01 (MVP scope)

---

## Изменения

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 2026-05-23 | Первый полный комплект документации |
