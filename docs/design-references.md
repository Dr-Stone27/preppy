# Design references

These are taken from the public App Store screenshots of cooking and shopping apps. Store screenshots are marketing shots: they show each app's best screens, not every state.

The ideas already in Preppy or already suggested are left out: the At home and To buy tabs, the three Have/Low/Out choices, one step at a time, generated bowls, prep-ticket cards, a swipeable step deck, a strike-through into an "In basket" section, and bowls filling layer by layer.

## Crouton (Apple Design Award winner)
Source: https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987

- **A timer that floats with you.**
  - *How it works:* a running timer sits as a small pill over the screen, showing the step name and countdown ("Step 7: Bake Cookies · 10:57"). It stays visible while you scroll the recipe or look at another dish.
  - *What it could mean for Preppy:* when several dishes cook at once, each running timer becomes a pill. You can see "Jollof · 12:40" while you're on the chicken's step.
- **Quantities in colour.**
  - *How it works:* in the ingredient list, the amount ("1 cup", "2 tsp") is tinted in the action colour and the name stays ink. You can read down the amounts at a glance.
  - *What it could mean for Preppy:* scaled amounts are the bit that changes with household size, so colouring them shows the scaling working.
- **Step mode is mostly empty.**
  - *How it works:* the step is one large paragraph, with "1 of 10" above it and a single round next button bottom-right. Temperatures inside the text are tinted ("350°F (175°C)").
  - *What it could mean for Preppy:* tint the things you act on inside a step (times, heat, amounts) so you can glance at them from across the kitchen.
- **Prep warnings on the plan.**
  - *How it works:* the meal-plan day shows a small tag on a dish ("Marination required").
  - *What it could mean for Preppy:* Preppy already works out its "start the day before" note. Showing it as a tag on the plan card, rather than in a note, matches this.

## Pestle
Source: https://apps.apple.com/us/app/pestle-recipe-manager/id1574776971

- **Changed amounts highlighted.**
  - *How it works:* after converting units or scaling, the amounts that changed are shown in the accent green and the names stay plain.
  - *What it could mean for Preppy:* this is the same idea as Crouton's coloured amounts, so two apps make it a pattern.
- **Timers on the lock screen.**
  - *How it works:* cook timers run in iOS's Dynamic Island and lock screen while you're in other apps.
  - *What it could mean for Preppy:* a web app can't do this. Preppy has no lock-screen or notification access, so timers live on the page.
- Pestle is otherwise photo-led. Its import from Instagram is the same job Preppy's shortcut already does.

## Bring! (shopping list)
Source: https://apps.apple.com/us/app/bring-grocery-shopping-list/id580669177

- **The list is a grid of picture tiles, not rows.**
  - *How it works:* each item is a square tile with a simple line drawing (apple, bread, milk carton, eggs, rice) and its name underneath. Tapping a tile adds it to the list or ticks it off.
  - *What it could mean for Preppy:* this is the strongest match for "icons in the pantry". At home could be a grid of ingredient tiles (rice bag, palm-oil bottle, curry tin, stock cubes) instead of rows with buttons.
- **Colour is the state.**
  - *How it works:* coral tiles are on the list (needed). Muted teal tiles are "recently used" and not currently needed. You read the whole list by colour before reading a single word.
  - *What it could mean for Preppy:* Have, Low and Out could be the tile's colour (basil, saffron, red) rather than a separate control. Changing it is the open question, since we moved away from tap-to-cycle on purpose.
- **Grouped by aisle, with section headers above tile grids.**
  - *How it works:* "Fruits & Vegetables", "Milk & Cheese" and "Grain Products" each head a block of tiles.
  - *What it could mean for Preppy:* this works with the group icons already added.
- **"Goes well with" suggestions.**
  - *How it works:* typing "Pasta" offers pasta sauce, canned tomatoes and parmesan as tiles.
  - *What it could mean for Preppy:* Preppy knows each dish's ingredients, so adding a dish could offer the pantry items it needs.
- **Item details.**
  - *How it works:* a sheet holds the variant (Napoletana, Marinara) and a photo of the exact product.

## AnyList (shopping and meal plan)
Source: https://apps.apple.com/us/app/anylist-grocery-shopping-list/id522167641

- **Each list row says what it's for.**
  - *How it works:* under "Sweet Potatoes (1 lb)" it reads "for Roasted Sweet Potatoes".
  - *What it could mean for Preppy:* in the shop you can see which dish an item is for, so you can make a sensible swap or skip it.
- **Aisle headers are coloured bands with an icon** ("Dairy", "Produce", "Seafood") running across the list.
  - *What it could mean for Preppy:* this is a heavier version of the group icons just added. Aisles stay findable while you scroll fast.
- **Item thumbnails.**
  - *How it works:* each row has a small picture of the item (eggs, broccoli, a light bulb) at the left.
- **Adding a recipe to the list is a checklist first.**
  - *How it works:* the recipe's ingredients appear with tick circles, some already ticked, and a "1x" scale on the side. You untick what you have before "Add all ingredients to list".
  - *What it could mean for Preppy:* Preppy does this automatically from At home, which is better.
- **Meal plan as a month calendar with the chosen day listed below.**
  - *How it works:* each meal carries a coloured meal-type label (Breakfast, Lunch, Dinner).

## NYT Cooking
Source: https://apps.apple.com/us/app/nyt-cooking-quick-tasty-meals/id911422904

- **Top-down bowls are the house style of food.**
  - *How it works:* almost every photo is shot from directly above, as a bowl or plate on a surface.
  - *What it could mean for Preppy:* this supports Preppy's top-down bowl art as the right viewpoint. The richness comes from what's in the bowl, not the angle.
- **Editorial serif titles over plain sans details.**
  - *How it works:* the dish name is set large in a serif ("White Chicken Chili"), with a small label-and-value block underneath (Time, Prep, Cook, Rating).
  - *What it could mean for Preppy:* this is already how Fraunces plus Jakarta is set up.
- **Browse by tiles with a label pill sitting on the picture.**
  - *How it works:* categories (Dinner, Vegetarian, <30 Min, Easy) are a 3-wide grid of food images, each with a white pill label overlapping its bottom edge.
  - *What it could mean for Preppy:* Library's "By cuisine" and "By flavour" rows could be bowl tiles with a pill: Nigerian, Korean, Peppered, Curry.
- **A shopping action next to the saved state** ("Saved" next to "Shop ingredients") at the top of the recipe.

## Patterns, by screen

**Cook day**
- A floating timer pill for each running timer that stays visible across steps and dishes (Crouton).
- Amounts, heat and times tinted inside the step text (Crouton).
- A near-empty step screen: large text, "3 of 12", and one round next button (Crouton).
- A web app can't show timers on the lock screen or in the Dynamic Island (Pestle shows what native gets).

**Shop: At home**
- A grid of ingredient tiles with line drawings, where colour shows the state (Bring!).
- Section headers above each tile grid (Bring!, AnyList).

**Shop: To buy**
- Each row says which dish it's for (AnyList). Preppy already does this: each To buy row lists its dishes (`ToBuy.tsx:207`).
- A small picture of the item on each row (AnyList).
- Suggestions of what goes with what you just added (Bring!).

**Plan and Home**
- Prep warnings as tags on the dish ("Marination required") (Crouton).
- Day sections, each holding small dish rows (Crouton, AnyList).

**Recipe and Library**
- Scaled amounts in colour (Crouton, Pestle).
- Browse tiles with a label pill on the image (NYT Cooking).
- Top-down plated food as the visual language (NYT Cooking).

**Not found:** an app that illustrates food the way Preppy does. The cooking apps here all use photos, so the bowl art has no direct reference and stays Preppy's own.
