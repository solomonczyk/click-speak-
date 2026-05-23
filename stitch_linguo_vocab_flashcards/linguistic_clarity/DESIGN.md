---
name: Linguistic Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#4e565b'
  on-tertiary: '#ffffff'
  tertiary-container: '#666f74'
  on-tertiary-container: '#e9f2f8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#dbe4ea'
  tertiary-fixed-dim: '#bfc8ce'
  on-tertiary-fixed: '#141d21'
  on-tertiary-fixed-variant: '#3f484d'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-vocab:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  interactive-btn:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The brand personality is rooted in **Modern Minimalism**, prioritizing cognitive ease and emotional encouragement. This design system is crafted for a language learning environment where focus is the primary currency. By eliminating visual clutter, the UI reduces "choice paralysis" and allows the user to immerse themselves in linguistic acquisition.

The aesthetic is professional yet approachable, utilizing heavy whitespace and a restrained color palette to create a "sanctuary for study." The emotional response should be one of calm confidence—moving away from the frantic gamification of competitors and toward a sophisticated, structured learning experience.

## Colors

This design system uses a palette specifically tuned for long-duration study sessions. 

- **Primary (Soft Blue):** Used for primary actions, focus states, and active navigational elements. It provides a sense of stability and intelligence.
- **Secondary (Mint Green):** Reserved for "Success" states, progress indicators, and "Easy" ratings. This shade is selected to be refreshing rather than jarring.
- **Tertiary (Sky Wash):** A very light blue used for large surface areas and background containers to reduce the harshness of pure white (#FFFFFF).
- **Neutral (Slate Gray):** Provides grounded legibility for body text and secondary metadata.

The background should primarily utilize the tertiary wash or pure white to maintain a high-breathability layout.

## Typography

The typography system relies exclusively on **Inter** for its exceptional legibility and neutral, systematic tone. 

- **Display Vocab:** Used for the primary word or phrase being learned. It features tight letter-spacing and a heavy weight to anchor the user's focus.
- **Headline Levels:** Use semantic hierarchy for lesson titles and module headers.
- **Label Caps:** Used for micro-copy like "Mastery Level" or "Part of Speech" to provide categorization without distracting from the main content.
- **Legibility First:** Line heights are generous (1.5x for body text) to ensure that translated phrases are easy to scan.

## Layout & Spacing

The design system employs a **Fluid-to-Fixed Grid**. On mobile, a single column with 20px side margins is used. On desktop, content is centered within a 1200px max-width container using a 12-column grid.

Spacing follows a strict 4px baseline power-of-two scale. Use `48px (xl)` for vertical section breathing room and `16px (md)` for internal component padding. Learning interfaces should avoid dense packing; if a screen feels "busy," increase the vertical spacing between the vocabulary card and the action buttons.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. 

1.  **Level 0 (Surface):** The background layer, using the Tertiary Sky Wash.
2.  **Level 1 (Cards):** Pure white surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.04)). This makes the vocabulary cards feel like they are floating slightly above the workspace.
3.  **Level 2 (Active States/Overlays):** Elements that require immediate interaction use a slightly more defined shadow (0px 8px 30px rgba(0,0,0,0.08)).

Avoid harsh borders. Instead, use subtle 1px strokes in a slightly darker shade of the background color to define boundaries without adding visual weight.

## Shapes

The design system uses a **Rounded** shape language (8px / 0.5rem base) to maintain an "encouraging" and "soft" feel. 

- **Cards:** Use `rounded-lg` (16px) to appear friendly and modern.
- **Buttons:** Use `rounded-md` (8px) for a precise, clickable appearance.
- **Progress Rings:** Always use rounded caps for the stroke to reinforce the soft aesthetic.
- **Input Fields:** Follow the 8px standard to match the primary action buttons.

## Components

### Vocabulary Cards
The center-piece of the learning experience. White background, `rounded-lg` corners, and Level 1 elevation. Text should be centered with the `display-vocab` style.

### Action Buttons (Easy/Hard/Again)
- **General:** Medium-sized with `interactive-btn` typography.
- **Hard/Again:** Low-saturation neutrals or subtle warm grays to avoid punishing the user visually for a mistake.
- **Easy/Good:** Uses the Primary Blue or Secondary Green.
- **States:** Hover states should involve a subtle scale-up (1.02x) rather than a dramatic color change.

### Progress Rings
Use a 4px or 6px stroke width. The "track" should be a 10% opacity version of the "indicator" color. This provides a clean, professional way to track daily goals.

### Navigation
Simple, thin-stroke (2pt) icons. The active state is indicated by a Primary Blue color and a small 4px dot below the icon, rather than a solid background fill.

### Input Fields
Clean, minimal borders. When focused, the border transitions to Primary Blue with a 2px "glow" (soft shadow) rather than a thick stroke.