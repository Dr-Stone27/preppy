---
version: alpha
name: Preppy
description: Warm, calm, kitchen-table meal-prep planner. Cream canvas, one loud thing per screen, drawn bowls instead of photos.
colors:
  primary: "#2F4D52"
  primary-pressed: "#253E42"
  primary-soft: "#E3EEEC"
  on-primary: "#FFFFFF"
  secondary: "#646962"
  tertiary: "#FF6B35"
  tertiary-soft: "#FFF0E8"
  tertiary-ink: "#B5461C"
  neutral: "#FFFDF9"
  surface: "#FFFFFF"
  surface-subtle: "#F7F2EA"
  border: "#EAE5DC"
  border-strong: "#D9D2C5"
  ink: "#1E1B18"
  success: "#4C7656"
  success-soft: "#EAF2EC"
  warning: "#FF9F1C"
  warning-soft: "#FFF4DF"
  warning-ink: "#8A5A0B"
  danger: "#B23A21"
  danger-soft: "#FBE6DE"
typography:
  display:
    fontFamily: Fraunces
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: -0.02em
  h1:
    fontFamily: Fraunces
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: -0.02em
  h2:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: -0.02em
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
  eyebrow:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.12em
rounded:
  chip: 10px
  input: 14px
  button: 16px
  card: 20px
  feature: 24px
  sheet: 28px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  gutter: 20px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 48px
  touch: 48px
  content-max: 560px
motion:
  tap:
    duration: 140ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0.7, 0.2, 1)
  enter:
    duration: 200ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0.7, 0.2, 1)
  stagger:
    duration: 200ms
    delay: 40ms
    timingFunction: cubic-bezier(0.2, 0.7, 0.2, 1)
  sheet:
    duration: 200ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0.7, 0.2, 1)
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    height: 52px
    padding: 0 20px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: 48px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: 16px
  card-hero:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.feature}"
    padding: 24px
  tag:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    height: 24px
    padding: 2px 10px
  tag-accent:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.tertiary-ink}"
    rounded: "{rounded.chip}"
  group-tint-1:
    backgroundColor: "{colors.tertiary-soft}"
  group-tint-2:
    backgroundColor: "{colors.primary-soft}"
  timer-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 36px
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: 24px
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    height: 64px
  tab-bar-active:
    textColor: "{colors.primary}"
  eyebrow:
    textColor: "{colors.secondary}"
    typography: "{typography.eyebrow}"
  canvas:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
  card-subtle:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.card}"
  divider:
    backgroundColor: "{colors.border}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: 48px
  input-focused:
    backgroundColor: "{colors.border-strong}"
  status-have:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
  status-low:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-ink}"
    rounded: "{rounded.full}"
  status-low-fill:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ink}"
  status-out:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
  accent-fill:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
---

# Preppy

## Overview

Preppy is a meal-prep planner for people who cook in batches: pick a few dishes, it plans the cooks across the week, scales them to the household, writes the shopping list from what you don't have, and walks you through cook day in order. Most of the library is Nigerian food, alongside Chinese, Korean, Indian and Tex-Mex.

It is a phone-first web app installed to the home screen, used one-handed, often in a kitchen or a shop. There is no native app and no push notifications.

The feeling is **warm, calm, kitchen-table**. It should feel like a well-kept recipe notebook, not a dashboard. It looks considered because every choice is deliberate and repeated, not because of effects. Three rules drive everything below:

1. **One screen, one idea.** Every screen answers one question. Home: *what's my next cook?* Plan: *what am I cooking, and when?* Cook day: *what do I do right now?* Anything that doesn't serve that question moves down the page, into a sheet, or goes away.
2. **One loud thing.** The background is quiet. Each screen gets exactly one hero card that answers its question, usually holding a bowl and the next action. The screen's one primary button and its one orange element (if it has one) both sit inside that hero card. Everything else is ink on cream or white.
3. **Room to breathe.** The main object sits with generous space around it. If a screen feels full, take something out rather than make things smaller.

## Colors

The palette is cream and ink with one action colour, one warm accent, and three status colours that mean only one thing each.

- **Neutral, the cream canvas (#FFFDF9):** every page background. Never tinted, never a gradient.
- **Surface, white (#FFFFFF):** cards and sheets sitting on the cream.
- **Surface subtle, oat (#F7F2EA):** quiet fills such as inactive pills, the step-count track, and grouped areas.
- **Ink (#1E1B18):** headings and body text. 16.6:1 on canvas.
- **Secondary, sage grey (#646962):** metadata, captions, inactive tabs. 5.6:1 on canvas.
- **Primary, deep teal (#2F4D52):** the action colour, used for primary buttons, the active tab, links and selected states. White text on it is 9.1:1.
- **Tertiary, pepper orange (#FF6B35):** the warm accent. **Fills only, never small text** (white on it is only 2.8:1). Use `tertiary-ink` (#B5461C) for orange-family text. At most one orange element per screen.
- **Status:** basil (#4C7656) means done or have. Saffron (#FF9F1C, fill only) means low, with `warning-ink` for text. Red (#B23A21) means out or danger. The strong status colours never decorate; they only report state.
- **Soft tints group things that belong together.** The soft fills (`tertiary-soft`, `primary-soft`, `warning-soft`, `success-soft`) may mark which items share a group, such as which days on the Plan day strip belong to which cook. That is information, not decoration, and it does not count as the screen's orange element. Always as a background fill, never on text.

The bowl illustrations have their own palette (rice golds, stew reds, efo greens). It is kept separate from the interface tokens on purpose: food carries colour, the interface does not.

## Typography

Two families, no others. Fraunces (a soft serif) is the cookbook voice and Plus Jakarta Sans is the working voice.

- **Fraunces** for display, h1 and h2: screen titles, dish names, the big step text on cook day. Weight 500, tight tracking (-0.02em), balanced line wrapping.
- **Plus Jakarta Sans** for everything else: h3 (700), body (400), labels (600), and eyebrows (700, uppercase, 0.12em tracking, sage grey).
- Dish names are Fraunces at 14px and above. Below 14px (plan grid cells, timer pills) they are Jakarta 600, because the serif breaks down that small. Amounts, times and counts are always Jakarta.
- One display-size line per screen at most.
- In cook-day step text, the things you act on (times, heat, amounts) are set in Jakarta 600 and tinted primary, so they read from across the kitchen.

## Layout

- 4px base grid. 20px side gutter (16px under 360px wide). Content max width 560px, centred.
- Touch targets are at least 48px.
- Vertical rhythm: 24px between groups, 12–16px within a group.
- The main object of the screen sits in the top half, visible without scrolling. Secondary lists start below it.
- A bottom tab bar (Home, Plan, centre Add, Library, Shop), 64px plus the safe area.

## Elevation & Depth

Depth is soft and rare. There are two shadows only:

- **Card:** `0 4px 20px rgba(30,27,24,0.05)`, for white cards on cream.
- **Floating:** `0 8px 28px rgba(30,27,24,0.09)`, for sheets, the timer pills and the Add button.

No borders and shadows together on the same card. No inner shadows, glows or blurs.

## Shapes

Generous, consistent rounding: chips 10px, inputs 14px, buttons 16px, cards 20px, the one hero card per screen 24px, sheets 28px, pills fully round. Icons are a small set of 24px line icons with a 1.8 stroke and rounded joins.

Dishes are drawn as **top-down ceramic bowls** (cream glaze, earth-brown rim, a soft shadow) built from the recipe's own ingredients. There are no food photos in the app. A bowl works from 40px to 232px and drops detail at small sizes.

## Motion & Micro-interaction

Motion is short, eased, and explains where things went. Nothing moves linearly, and nothing moves just to be noticed.

- Every transition uses the house curve `cubic-bezier(0.2, 0.7, 0.2, 1)`: a quick start that settles softly.
- **Tap feedback:** 140ms. Buttons press to 0.98 scale and back.
- **Enter:** 200ms. Content rises 8px and fades in. Lists stagger 40ms per item, with at most 6 items animated, and the rest appear at once.
- **Sheets:** 200ms, slide up from the bottom.
- **Changes between steps or days** slide 24px horizontally in the direction of travel while fading, never as a hard swap.
- Ticking something off: the tick draws in, the row settles, and it never bounces more than once.
- `prefers-reduced-motion`: all movement (rise, slide, scale) is removed. Content still fades in, over 140ms, so changes are not jarring.

## Voice & Content Strategy

- Plain, warm, short. Talk like a friend who cooks, not like an app. "Pick two for Sunday", not "Select recipes to add to your plan".
- Sentence case everywhere. No exclamation marks in interface copy.
- Numbers are written as numerals with units: "3 portions", "25 min".
- Nigerian dish and ingredient names keep their real names (tatashe, rodo, iru, efo).

## Components

- **Primary button:** teal fill, white Jakarta 600, 52px tall, 16px radius. One primary button per screen.
- **Secondary button:** white with a 1.5px `border-strong` outline and ink text.
- **Card:** white, 20px radius, card shadow, 16px padding. A **hero card** (24px radius, 24px padding) holds the screen's one main object.
- **Tag:** 24px tall, 10px radius, oat fill, ink label text. The accent tag (orange-soft fill, orange-ink text) is reserved for the single most important tag on a screen, such as "Start the day before".
- **Timer pill:** ink fill, cream text, floating shadow, 36px tall with a 48px tap area. It stays pinned at the top of cook day while running. When a timer finishes it turns orange; if two finish together, both may be orange, since each needs action.
- **Sheet:** white, 28px top radius, slides up.
- **Eyebrow:** a small uppercase sage label above a group ("SUNDAY COOK", "NEXT UP").
- **Bowl:** the dish illustration. On a hero card, one or two bowls show at 160px. Three or four overlap and shrink so the group fits the card's width, never below 88px.

## Do's and Don'ts

**Do**
- Give each screen one question to answer, and one loud element that answers it.
- Keep the canvas plain cream. Let bowls and the single orange accent carry the colour.
- Repeat the same patterns screen to screen. Consistency is what reads as quality.
- Show the main object without scrolling.
- After building a screen, review it and remove anything that doesn't help the user cook, plan or shop.

**Don't**
- Don't use gradients, glows, glassmorphism, blurs or decorative patterns.
- Don't put orange on small text, or use more than one orange element per screen (soft group tints and finished timers aside).
- Don't put bright on bright. Colour sits on cream, white or ink.
- Don't use food photos inside the app. Bowls only.
- Don't add a third typeface, or set dish names in sans.
- Don't use linear motion, bouncy springs on lists, or animation longer than 300ms in the interface.
- Don't dissolve one full screen into another; slide in the direction of travel instead.
- Don't stack cards inside cards.
- Don't use emoji as interface icons.
