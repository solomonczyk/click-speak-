# Acceptance Criteria — Click&Speak MVP

**Версия:** 1.0.0  
**Дата:** 2026-05-23  
**Формат:** Given / When / Then + чеклисты

Приёмка MVP считается пройденной, когда **все Must-критерии** отмечены Pass, **нет открытых P0 дефектов**, и scope соответствует [01-product-vision-prd.md](./01-product-vision-prd.md) § Out of Scope.

---

## 1. Quick Add

### AC-QA-01 (Must)
**Given** пользователь на экране Decks с активной колодой ES→EN  
**When** он открывает Quick Add, вводит `aproximadamente` и подтверждает  
**Then** в течение 5 секунд отображается preview с `translation`, `exampleTarget`, `partOfSpeech` и активной кнопкой воспроизведения аудио

### AC-QA-02 (Must)
**Given** preview отображён  
**When** пользователь нажимает Save  
**Then** карточка появляется в списке колоды с `status: new` и воспроизводимым audio

### AC-QA-03 (Must)
**Given** preview отображён  
**When** пользователь редактирует `translation` и сохраняет  
**Then** в БД сохраняется отредактированное значение

### AC-QA-04 (Must)
**Given** API translate недоступен (`502`)  
**When** пользователь подтверждает term  
**Then** показывается partial preview с пустым `translation`, подсветкой поля и кнопками «Повторить» / «Сохранить вручную»

### AC-QA-05 (Must)
**Given** TTS недоступен, translate успешен  
**When** пользователь сохраняет  
**Then** карточка сохраняется с badge/предупреждением «Аудио недоступно»

### AC-QA-06 (Should)
**Given** desktop  
**When** пользователь нажимает `Ctrl+K`  
**Then** открывается Quick Add modal

---

## 2. Decks

### AC-DK-01 (Must)
**Given** пользователь на `/decks`  
**When** создаёт колоду с title, sourceLang, targetLang  
**Then** колода отображается в таблице с `cardCount: 0`

### AC-DK-02 (Must)
**Given** колода с 3 карточками  
**When** пользователь удаляет колоду и подтверждает  
**Then** колода и все карточки удалены из IndexedDB

### AC-DK-03 (Must)
**Given** таблица из 5 колод  
**When** пользователь вводит в search часть названия  
**Then** отображаются только совпадающие колоды

### AC-DK-04 (Must)
**Given** CSV файл UTF-8 с заголовком `term,translation,example` и 10 строками  
**When** импорт в колоду  
**Then** создано 10 карточек, показан отчёт «Импортировано: 10»

### AC-DK-05 (Must)
**Given** в колоде уже есть карточка `term=hello`  
**When** импорт CSV содержит строку `hello,...`  
**Then** строка пропущена, отчёт «Пропущено: 1 (дубликат)»

### AC-DK-06 (Must)
**Given** колода с due карточками  
**When** нажата иконка Study (play)  
**Then** переход на `/learn?deckId={id}&mode=review`

### AC-DK-07 (Should)
**Given** колода с 50% mastered cards  
**When** отображается таблица  
**Then** progress bar mastery ≈ 50% (±1%)

---

## 3. Learn / Review

### AC-LRN-01 (Must)
**Given** 10 due карточек в колоде, shuffle включён  
**When** начата сессия  
**Then** порядок карточек не алфавитный и отличается при второй сессии (при том же seed off)

### AC-LRN-02 (Must)
**Given** карточка лицом вверх  
**When** tap на карточку или Space  
**Then** flip на оборот, видны 4 SRS-кнопки

### AC-LRN-03 (Must)
**Given** оборот виден  
**When** нажата кнопка Good  
**Then** `dueAt` увеличен (≥ 1 день от now), переход к следующей карточке

### AC-LRN-04 (Must)
**Given** оборот виден  
**When** нажата клавиша `1`  
**Then** эквивалент Again: `dueAt` ≈ now + 1 минута

### AC-LRN-05 (Must)
**Given** сессия 5/10  
**When** пользователь обновляет страницу  
**Then** сессия продолжается с сохранённым прогрессом (5 уже оценённых не повторяются в той же сессии)

### AC-LRN-06 (Must)
**Given** 0 due карточек  
**When** открыт `/learn?mode=review`  
**Then** empty state с текстом и CTA (новые слова / другая колода)

### AC-LRN-07 (Must)
**Given** активная сессия  
**When** нажат Exit и подтверждение  
**Then** возврат на Dashboard/Decks, SRS оценённые карточек сохранён

### AC-LRN-08 (Must)
**Given** карточка с `audioUrl`  
**When** нажат `volume_up` на лицевой стороне (без flip)  
**Then** аудио воспроизводится, иконка кратковременно `primary`

### AC-LRN-09 (Must)
**Given** progress bar сессии  
**When** оценена 1 из 20 карточек  
**Then** отображается `1 / 20` и bar ~5%

### AC-LRN-10 (Should)
**Given** desktop Learn  
**When** отображаются keyboard hints  
**Then** видны подсказки SPACE и 1-4

---

## 4. Dashboard

### AC-DB-01 (Must)
**Given** есть due карточки  
**When** нажат «Начать обучение»  
**Then** переход на `/learn` с очередью due

### AC-DB-02 (Must)
**Given** пользователь учился вчера и сегодня  
**When** открыт Dashboard  
**Then** streak ≥ 2 (дней подряд с активностью)

### AC-DB-03 (Must)
**Given** daily goal 15 reviews, выполнено 12  
**When** отображается goal ring  
**Then** прогресс 80% (±2%)

### AC-DB-04 (Must)
**Given** 3 колоды  
**When** Dashboard загружен  
**Then** отображаются deck cards с названием и % progress

### AC-DB-05 (Must)
**Given** MVP build  
**When** Dashboard загружен  
**Then** отсутствуют блоки Word of the Day, Flash Streak Bonus, Pro badge

---

## 5. Statistics

### AC-ST-01 (Must)
**Given** активность за 7 дней в DailyStats  
**When** открыт `/statistics`  
**Then** bar chart показывает 7 столбцов с корректными значениями

### AC-ST-02 (Must)
**Given** weekly goal 100 reviews, выполнено 85  
**When** отображается weekly ring  
**Then** 85%

### AC-ST-03 (Must)
**Given** MVP build  
**When** открыт `/statistics`  
**Then** нет секций Grammar/Listening/Speaking, badges, Download Report

### AC-ST-04 (Should)
**Given** 30 дней DailyStats  
**When** отображается график Words Learned  
**Then** линия/тренд отражает сумму newWords по дням

---

## 6. Settings

### AC-SET-01 (Must)
**Given** изменена пара языков по умолчанию  
**When** открыт Quick Add  
**Then** source/target предзаполнены новыми значениями

### AC-SET-02 (Must)
**Given** есть данные в IndexedDB  
**When** Export → Import на другом профиле браузера  
**Then** колоды и карточки идентичны (включая SRS поля)

### AC-SET-03 (Must)
**Given** подтверждено «Удалить все данные»  
**When** операция завершена  
**Then** IndexedDB пуст, UI показывает empty states

---

## 7. Mobile & responsive

### AC-MOB-01 (Must)
**Given** viewport 390×844  
**When** любой main route кроме Learn  
**Then** видна bottom navigation с 4 пунктами

### AC-MOB-02 (Must)
**Given** viewport 390×844  
**When** активна сессия Learn  
**Then** нет horizontal scroll; SRS кнопки в 4 колонки или 2×2 без обрезки текста

### AC-MOB-03 (Must)
**Given** viewport 390×844  
**When** отображается flashcard term длиной 20 символов  
**Then** текст переносится, не выходит за карточку

### AC-DESK-01 (Must)
**Given** viewport ≥ 1024px  
**When** `/decks`  
**Then** sidebar 256px, контент с отступом `ml-64`

---

## 8. Design system compliance

### AC-UI-01 (Must)
**Given** production build  
**When** сравнение primary color на CTA  
**Then** `#004ac6` (±0 при exact token)

### AC-UI-02 (Must)
**Given** flashcard  
**When** отображается term  
**Then** font-size 40px desktop / 32px mobile, weight 700

### AC-UI-03 (Must)
**Given** sidebar  
**When** загружено приложение  
**Then** бренд «Click&Speak», не «Linguist»

---

## 9. Non-functional acceptance

### AC-NFR-01 (Must)
**Given** production deploy  
**When** Lighthouse mobile на `/`  
**Then** Performance ≥ 85

### AC-NFR-02 (Must)
**Given** axe scan на `/learn`  
**When** CI run  
**Then** 0 critical violations

### AC-NFR-03 (Must)
**Given** API keys в `.env`  
**When** inspect client bundle  
**Then** keys отсутствуют в client JS

---

## 10. Out of scope verification (Must NOT exist)

| ID | Проверка | Pass = отсутствует |
|----|----------|-------------------|
| AC-OOS-01 | XP / уровни | ✅ |
| AC-OOS-02 | Badges / Linguistic Elite | ✅ |
| AC-OOS-03 | Notifications center functional | ✅ |
| AC-OOS-04 | AI deck generation banner | ✅ |
| AC-OOS-05 | Social share | ✅ |
| AC-OOS-06 | Account login/register | ✅ |

---

## 11. Test execution checklist

| Suite | Tool | Coverage |
|-------|------|----------|
| SRS logic | Vitest | `lib/srs/*` |
| Repos | Vitest + fake-indexeddb | CRUD |
| Quick Add E2E | Playwright | AC-QA-01–03 |
| Learn E2E | Playwright | AC-LRN-01–07 |
| Import E2E | Playwright | AC-DK-04–05 |
| a11y | axe-playwright | AC-NFR-02 |

---

## 12. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA | | | |

---

## 13. Связанные документы

- [01-product-vision-prd.md](./01-product-vision-prd.md)  
- [02-ux-ui-spec.md](./02-ux-ui-spec.md)  
- [08-roadmap.md](./08-roadmap.md)
