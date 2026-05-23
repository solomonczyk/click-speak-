# API Specification — Click&Speak

**Версия:** 1.0.0  
**Дата:** 2026-05-23  
**Base URL (prod):** `https://{domain}`  
**Format:** JSON, UTF-8

---

## 1. Обзор

| Категория | MVP | Phase 2 |
|-----------|-----|---------|
| BFF routes (Next.js) | `/api/enrich`, `/api/tts` | + `/api/sync`, `/api/auth/*` |
| External APIs | Dictionary, Translate, TTS | Same + object storage |
| Client → Dexie | All CRUD local | Sync to server |

**Аутентификация MVP:** нет (публичные BFF с rate limit по IP).  
**Аутентификация Phase 2:** Bearer JWT session cookie.

---

## 2. Общие соглашения

### 2.1 HTTP headers

```
Content-Type: application/json
Accept: application/json
```

### 2.2 Ошибки

```typescript
interface ApiError {
  error: {
    code: string;       // MACHINE_READABLE
    message: string;    // Human readable (RU in UI)
    details?: unknown;
  };
}
```

| HTTP | code | Когда |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Zod fail |
| 429 | `RATE_LIMITED` | Too many requests |
| 502 | `UPSTREAM_ERROR` | External API fail |
| 503 | `SERVICE_UNAVAILABLE` | All providers down |

### 2.3 Rate limits (BFF)

| Route | Limit |
|-------|-------|
| `POST /api/enrich` | 30 req / min / IP |
| `GET /api/tts` | 60 req / min / IP |

---

## 3. MVP BFF Endpoints

### 3.1 POST `/api/enrich`

Автоматическое обогащение карточки для Quick Add.

**Request:**

```json
{
  "term": "aproximadamente",
  "sourceLang": "es",
  "targetLang": "en"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `term` | string | ✅ | 1–200 chars, trimmed |
| `sourceLang` | string | ✅ | ISO 639-1 |
| `targetLang` | string | ✅ | ISO 639-1 |

**Response 200:**

```json
{
  "term": "aproximadamente",
  "translation": "approximately",
  "exampleTarget": "Había aproximadamente cien personas.",
  "exampleNative": "There were approximately one hundred people.",
  "partOfSpeech": "adverb",
  "cefrLevel": null,
  "phonetic": "apɾoksimaˈmente",
  "audioUrl": "/api/tts/cache/xyz.mp3",
  "partial": false,
  "warnings": []
}
```

**Partial response** (`partial: true`) — когда часть провайдеров недоступна:

```json
{
  "term": "xyz",
  "translation": "",
  "exampleTarget": null,
  "exampleNative": null,
  "partOfSpeech": null,
  "cefrLevel": null,
  "phonetic": null,
  "audioUrl": null,
  "partial": true,
  "warnings": ["TRANSLATE_FAILED", "TTS_FAILED"]
}
```

**Server pipeline:**

1. Validate body (Zod)  
2. `DictionaryProvider.lookup(term, sourceLang)`  
3. `TranslateProvider.translate(term, sourceLang, targetLang)`  
4. Pick best example from dictionary or generate template  
5. `TranslateProvider.translate(example, …)` → `exampleNative`  
6. `TtsProvider.synthesize(term, sourceLang)` → `audioUrl`  
7. Return aggregated `CardDraft`

**Latency target:** p95 &lt; 4s

---

### 3.2 GET `/api/tts`

Синтез или проксирование аудио для term.

**Query parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `text` | ✅ | Текст для озвучки |
| `lang` | ✅ | ISO 639-1 |
| `voiceId` | | Override default voice |

**Response 200:**

- `Content-Type: audio/mpeg` (binary stream)  
  **OR**  
- JSON `{ "url": "https://..." }` if redirect preferred

**Response 502:** TTS provider error

**Caching:** `Cache-Control: public, max-age=31536000, immutable` for hash-based URLs

---

## 4. External API integrations

### 4.1 Dictionary — Free Dictionary API

- **URL:** `https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}`  
- **Lang support:** `en` primarily; для других языков — fallback translate-only  
- **Extract:** `phonetic`, `meanings[0].partOfSpeech`, `meanings[0].definitions[0].example`

### 4.2 Translation

**Primary (paid, quality):** DeepL API v2

```
POST https://api-free.deepl.com/v2/translate
Body: text, source_lang, target_lang
```

**Fallback:** LibreTranslate (self-hosted or public)

### 4.3 TTS providers

| Provider | Quality | Notes |
|----------|---------|-------|
| Azure Neural TTS | High | Recommended MVP production |
| Google Cloud TTS | High | Alternative |
| Web Speech API | Low | Client-only fallback, no BFF |

**Azure example (server):**

```
POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
Headers: Ocp-Apim-Subscription-Key, Content-Type: application/ssml+xml
Body: SSML with neural voice e.g. es-ES-ElviraNeural
```

**Voice mapping table** (config `lib/enrichment/voices.json`):

```json
{
  "es": { "default": "es-ES-ElviraNeural", "gender": "female" },
  "en": { "default": "en-US-JennyNeural", "gender": "female" },
  "ru": { "default": "ru-RU-SvetlanaNeural", "gender": "female" }
}
```

---

## 5. Client-local API (Dexie repositories)

Не HTTP — внутренний контракт для согласованности.

### 5.1 `deckRepo`

| Method | Signature |
|--------|-----------|
| `list` | `() => Promise<DeckWithStats[]>` |
| `get` | `(id: string) => Promise<Deck \| undefined>` |
| `create` | `(input: CreateDeckInput) => Promise<Deck>` |
| `update` | `(id, patch) => Promise<Deck>` |
| `delete` | `(id) => Promise<void>` |

### 5.2 `cardRepo`

| Method | Signature |
|--------|-----------|
| `listByDeck` | `(deckId, { search? }) => Promise<Card[]>` |
| `getDue` | `({ deckId?, limit? }) => Promise<Card[]>` |
| `create` | `(input: CreateCardInput) => Promise<Card>` |
| `update` | `(id, patch) => Promise<Card>` |
| `delete` | `(id) => Promise<void>` |
| `importCsv` | `(deckId, rows) => Promise<ImportResult>` |

### 5.3 `learnRepo`

| Method | Signature |
|--------|-----------|
| `buildQueue` | `(options: QueueOptions) => Promise<Card[]>` |
| `grade` | `(cardId, grade: Grade) => Promise<Card>` |

---

## 6. Phase 2 REST API (draft)

### 6.1 Auth

#### POST `/api/auth/register`

```json
{ "email": "user@example.com", "password": "********" }
```

→ `201` `{ "userId": "...", "token": "..." }`

#### POST `/api/auth/login`

→ `200` `{ "token": "..." }` + HttpOnly cookie

### 6.2 Decks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/decks` | List user decks |
| POST | `/api/decks` | Create |
| GET | `/api/decks/:id` | Get one |
| PATCH | `/api/decks/:id` | Update |
| DELETE | `/api/decks/:id` | Delete |

**Deck response** includes server `updatedAt` for sync.

### 6.3 Cards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/decks/:deckId/cards` | List |
| POST | `/api/decks/:deckId/cards` | Create |
| PATCH | `/api/cards/:id` | Update |
| DELETE | `/api/cards/:id` | Delete |

### 6.4 Sync

#### POST `/api/sync`

**Request:**

```json
{
  "lastSyncAt": "2026-05-20T00:00:00.000Z",
  "decks": [ ],
  "cards": [ ],
  "deletedDeckIds": [],
  "deletedCardIds": []
}
```

**Response:**

```json
{
  "serverTime": "2026-05-23T12:00:00.000Z",
  "decks": [ ],
  "cards": [ ],
  "conflicts": []
}
```

**Conflict policy:** Last-Write-Wins by `updatedAt`; conflicts returned for manual merge (Phase 2.1).

---

## 7. OpenAPI fragment (BFF enrich)

```yaml
openapi: 3.0.3
info:
  title: Click&Speak BFF
  version: 1.0.0
paths:
  /api/enrich:
    post:
      summary: Enrich term into card draft
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [term, sourceLang, targetLang]
              properties:
                term:
                  type: string
                sourceLang:
                  type: string
                  minLength: 2
                  maxLength: 2
                targetLang:
                  type: string
                  minLength: 2
                  maxLength: 2
      responses:
        "200":
          description: Card draft
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CardDraft"
        "400":
          description: Validation error
        "429":
          description: Rate limited
components:
  schemas:
    CardDraft:
      type: object
      properties:
        term:
          type: string
        translation:
          type: string
        exampleTarget:
          type: string
          nullable: true
        exampleNative:
          type: string
          nullable: true
        partOfSpeech:
          type: string
          nullable: true
        cefrLevel:
          type: string
          nullable: true
        phonetic:
          type: string
          nullable: true
        audioUrl:
          type: string
          nullable: true
        partial:
          type: boolean
        warnings:
          type: array
          items:
            type: string
```

---

## 8. Security notes

- Never log `term` in production logs (PII-adjacent).  
- API keys only in server env.  
- Validate `lang` against allowlist to prevent SSRF in misconfigured providers.  
- Sanitize `term` length and reject HTML/script.

---

## 9. Связанные документы

- [03-architecture.md](./03-architecture.md)  
- [04-data-model.md](./04-data-model.md)  
- [open-questions.md](./open-questions.md) (OQ-003 TTS provider)
