# Preppy — design brief

Preppy is a meal-prep planner for people who cook in batches. You pick a few dishes, it plans when to cook them across the week, scales them to your household, builds the shopping list from what you don't already have, and walks you through cook day in order. Recipes come from a built-in library of 44 dishes or are saved from Instagram and TikTok posts.

Live: https://preppy-liart.vercel.app

## Who uses it
Busy people cooking for themselves or a small household, mostly Nigerian food alongside Chinese, Korean, Indian, Tex-Mex and other cuisines. Used one-handed on a phone, often in the kitchen or the shop.

## What it is technically
A phone-first web app installed to the home screen. There is no native app and no push notifications. Data lives on the device, with an optional emailed-code sign-in to sync and share recipes.

## Screens
- **Home:** this week at a glance and the next cook.
- **Plan:** cooks ("rounds") across the week, the dishes in each, and the portions for the household.
- **Cook day:** a step-by-step cooking order for everything in a round, one step at a time.
- **Library:** browse by cuisine or flavour, search, your saved recipes, and recipes shared by other cooks.
- **Recipe:** ingredients scaled to the household, steps, macros, creator credit.
- **Shop:** two tabs. *To buy* is the list grouped by aisle. *At home* lists dry goods, spices and sauces, each marked Have, Low or Out.
- **What can I make:** pick what's in the kitchen and see the dishes that fit.
- **Add:** save a recipe from a post or type one in.

## Visual language
- **Tone:** warm, calm, kitchen-table. Cream canvas, white cards, generous rounding, soft shadows.
- **Colour:**
  - Canvas `#FFFDF9`, ink `#1E1B18`, muted `#646962`.
  - Teal `#2F4D52` for actions.
  - Orange `#FF6B35` as the warm accent; it's used for fills, not small text.
  - Basil `#4C7656` means done or have, saffron `#FF9F1C` means low, red `#B23A21` means out or danger.
- **Type:** Fraunces for display and headings, Plus Jakarta Sans for body.
- **Shape:** cards 20px radius, buttons 16px, sheets 28px, pills fully round. 4px spacing grid, 20px gutter.
- **Icons:** a small set of 24px line icons with 1.8 stroke and rounded joins. The pantry uses a jar that's full, low or empty for Have, Low and Out.
- **Accessibility:** text meets WCAG AA on cream, and every colour pair has its contrast ratio recorded.

## The dish art
There are no food photos. Every dish is drawn as a top-down ceramic bowl: cream glaze, an earth-brown rim, a soft shadow. The contents are generated from the recipe's own ingredients, so a saved recipe gets a bowl too. The same dish always gets the same composition. The bowl works from 40px to 232px and drops detail at small sizes.

A bowl is built in layers:
1. **What fills it:**
   - Jollof, fried or white rice.
   - A sauce whose colour comes from the dish (red stew, green efo, golden egusi, curry, soy glaze).
   - A soup (greens, egusi curds, clear broth), beans, porridge or noodles.
2. **Layout:** a dish served over rice shows rice on one side and the sauce on the other.
3. **Protein by cut:** drumsticks, strips, glazed bites, mince, ribs, wings, chunks.
4. **Extras the recipe actually contains:** fried plantain, peas and carrot, spring onion, sesame, cucumber, pepper, lime.

Sweet dishes have their own shapes: moi moi on a leaf, akara beside pap, a pancake stack, flan, loaf slices, toast. The library is heavy on chicken (18 of 44) and Nigerian dishes (14 of 44), so these layers are what keep bowls from repeating.

## Where it stands
- The bowls are flat vector shapes with light shading. Small pieces get lost on pale backgrounds.
- The interface is functional and consistent but plain. Cards and lists dominate, with few moments of delight.
- Brand and illustration colours are separate: the interface tokens and the bowl palette are kept apart.
