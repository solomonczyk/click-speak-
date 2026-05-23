# Design System — Linguistic Clarity (Click&Speak)

**Версия:** 1.0.0  
**Источник токенов:** [`stitch_linguo_vocab_flashcards/linguistic_clarity/DESIGN.md`](../stitch_linguo_vocab_flashcards/linguistic_clarity/DESIGN.md)  
**Реализация:** Tailwind CSS 3.x + Inter + Material Symbols Outlined

---

## 1. Принципы

- **Modern Minimalism** — когнитивная лёгкость, минимум визуального шума.  
- **Focus-first** — слово на карточке — главный элемент (`display-vocab`).  
- **Encouraging, not punishing** — кнопки Again/Hard нейтральные; Easy/Good — primary/secondary.  
- **Breathable layout** — вертикальные отступы `xl` (48px) между секциями в Learn.

---

## 2. Color tokens

| Token | Hex | Использование |
|-------|-----|---------------|
| `background` / `surface` | `#f8f9ff` | Фон приложения |
| `surface-container-lowest` | `#ffffff` | Карточки, панели |
| `surface-container-low` | `#eff4ff` | Sidebar, inputs |
| `surface-container-high` | `#dce9ff` | Hover nav, chips |
| `on-surface` | `#0b1c30` | Основной текст |
| `on-surface-variant` | `#434655` | Вторичный текст |
| `outline` | `#737686` | Иконки, hints |
| `outline-variant` | `#c3c6d7` | Borders |
| `primary` | `#004ac6` | CTA, active nav, progress |
| `primary-container` | `#2563eb` | Easy button accent |
| `secondary` | `#006c49` | Success, Good, mastery |
| `secondary-container` | `#6cf8bb` | Good button border/bg |
| `tertiary` | `#4e565b` | Hard button |
| `error` | `#ba1a1a` | Again button |
| `error-container` | `#ffdad6` | Again hover bg |

---

## 3. Typography (Inter)

| Token | Size / Weight | Line height | Use |
|-------|---------------|-------------|-----|
| `display-vocab` | 40px / 700 | 48px, -0.02em | Слово на карточке (desktop) |
| `headline-lg` | 30px / 600 | 38px | Hero, section titles |
| `headline-lg-mobile` | 24px / 600 | 32px | Hero mobile |
| `headline-md` | 20px / 600 | 28px | Card titles, deck names |
| `body-lg` | 18px / 400 | 28px | Subtitles, examples |
| `body-md` | 16px / 400 | 24px | Body, nav labels |
| `label-caps` | 12px / 600 | 16px, 0.05em | META, PROGRESS, tags |
| `interactive-btn` | 16px / 500 | 20px | Buttons |

**Mobile Learn:** `display-vocab` → 32px (use `headline-lg-mobile` or custom 32/700).

---

## 4. Spacing & layout

| Token | Value |
|-------|-------|
| `base-unit` | 4px |
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 48px |
| `gutter` | 20px (mobile side margins) |
| `container-max` | 1200px |

**Grid:** 12 columns desktop, 1 column mobile. Content centered, `max-w-[1200px]`.

---

## 5. Radius & elevation

| Token | Value | Use |
|-------|-------|-----|
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 16px | Flashcard, deck cards |
| `rounded-xl` | 12–24px (mockup xl 0.75rem) | Hero cards |
| `rounded-full` | 9999px | Search, chips, avatar |

**Shadows:**

- Level 1 (cards): `0px 4px 20px rgba(0,0,0,0.04)` — class `.card-shadow`  
- Level 2 (active): `0px 8px 30px rgba(0,0,0,0.08)` — `.active-btn-shadow`  

---

## 6. Icons

- **Material Symbols Outlined**, 24px default, 2pt stroke.  
- Active nav: `FILL 1`, color `primary`, optional 4px dot below (mobile bottom nav).  
- Data attributes: `data-icon="volume_up"` для тестов.

---

## 7. Tailwind config mapping

Фрагмент для `tailwind.config.ts` (extend):

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        secondary: "#006c49",
        "secondary-container": "#6cf8bb",
        tertiary: "#4e565b",
        background: "#f8f9ff",
        surface: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        outline: "#737686",
        "outline-variant": "#c3c6d7",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "48px",
        gutter: "20px",
      },
      maxWidth: {
        container: "1200px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-vocab": ["40px", { lineHeight: "48px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-lg": ["30px", { lineHeight: "38px", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px" }],
        "body-md": ["16px", { lineHeight: "24px" }],
        "label-caps": ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.05em" }],
        "interactive-btn": ["16px", { lineHeight: "20px", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "16px",
        xl: "12px",
      },
      boxShadow: {
        card: "0px 4px 20px rgba(0, 0, 0, 0.04)",
        "card-active": "0px 8px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
};
export default config;
```

---

## 8. Компоненты (спецификация)

### 8.1 Vocabulary Card (Flashcard)

- BG: `surface-container-lowest`, `rounded-lg`, `shadow-card`, border `surface-container`.  
- Min height Learn: ~384px (`h-96`).  
- Front: `display-vocab` centered, label «Нажмите, чтобы увидеть перевод».  
- Audio: top-right `volume_up`, hover `primary`.  
- Back: `headline-lg` translation `primary`, `body-lg` italic example, chips POS/CEFR.

### 8.2 SRS Button Group

4 columns, gap `md`. Each: height 56px (`h-14`), `rounded-xl`, label caps interval below.

| Button | Text color | Border |
|--------|------------|--------|
| Again | `error` | `error-container` |
| Hard | `tertiary` | `tertiary-container` |
| Good | `secondary` | `secondary-container` |
| Easy | `primary` | `primary-container` |

Hover: `scale-[1.02]`; active: `scale-[0.98]`.

### 8.3 Progress bar (session)

- Track: `h-2`, `surface-container-highest`, `rounded-full`.  
- Fill: `primary`, width % animated 500ms.

### 8.4 SideNav (desktop)

- Width: 256px (`w-64`); Learn collapsed: 80px (`w-20`) expand on hover.  
- Active item: `text-primary`, `bg-surface-container-low`, `border-r-4 border-primary`.  
- Logo: **Click&Speak** `headline-lg` `text-primary`.

### 8.5 BottomNav (mobile)

- Fixed bottom, 4 items: Dashboard, Learn, Decks, Statistics.  
- Active: `primary` + dot indicator 4px.  
- Safe area: `pb-safe`.

### 8.6 Deck table row

- Hover: `bg-surface-container-low`.  
- Actions: edit, delete, play_circle (study).

### 8.7 Stat ring

- Stroke 6–8px, rounded caps.  
- Track: 10% opacity of indicator color.

### 8.8 Inputs

- Search: `rounded-full`, `bg-surface-container-low`, focus ring `primary/20` 2px.  
- Quick Add: minimal border, focus glow primary.

---

## 9. Motion

| Element | Animation |
|---------|-----------|
| Card flip | `rotateY(180deg)`, 600ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| SRS buttons reveal | opacity + translateY, 500ms after flip |
| Chart bars | height 0 → target, 1s ease-out (statistics) |
| Button hover | scale 1.02 |

---

## 10. Dark mode (Phase 2)

Токены `inverse-*` и `dark:` классы в мокапах зарезервированы. MVP — **light only**; не блокировать добавление `class="dark"` на `<html>`.

---

## 11. Чеклист соответствия мокапам

- [ ] Все цвета из §2 в Tailwind config  
- [ ] Inter подключён (400, 500, 600, 700)  
- [ ] Material Symbols Outlined  
- [ ] Card shadow Level 1  
- [ ] Active nav border-r-4 primary  
- [ ] Бренд Click&Speak в sidebar (не Linguist)
