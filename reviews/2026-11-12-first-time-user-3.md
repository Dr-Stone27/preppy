# Preppy: first-time user review 3

Thursday 12 November 2026. Reviewed at http://localhost:3210/, mainly at phone size (375 wide), then the main path again at tablet and desktop and with dark mode on. I acted as a new user who knew nothing about the product. In this setup, accounts, the combined cooking order and reading recipes from posts are switched off.

---

## 1. Verdict

Yes, I would keep it on my phone. It understands how people who batch-cook actually eat, the food is food I recognise, and the shopping list is the best part of the app. The most important fix is that Preppy gets confused about which cook you mean. It opened my first plan on next week while my problem was today. "Plan it for Sunday's cook" built a plan for last Sunday. And the Shop tab now opens on a cook that has already passed, with the message "Nothing to buy yet", even though I have a real list for this Sunday. The second fix is that the sides I chose (yam, plantain, rice) never show up on cook day, and they barely show up on the plan, so a new user cooks the stew and forgets what goes with it. The strongest part is how the steps connect: from the shopping list to cook day, each step builds on what I already told it. It knows which dishes use each ingredient, it skips what I already have at home, it suggests dishes that use up what I bought last time, and the cooking timers stay on screen when I move to another step or reload the page.

---

## 2. The journey as I lived it

| Time | Taps (approx.) | What happened |
|---|---|---|
| 0:00 | 0 | The landing page loaded blank for about a second, then showed the jollof pot and "Cook a few times. Eat well all week." Within ten seconds I understood it was a meal-prep planner. |
| 0:15 | 1 | Get started opened the setup at "When do you cook?" I picked Sun and Wed, set 2 people, avoided pork, mushrooms and okra, chose rice, yam, plantain, couscous and salad as sides, and ticked 5 things I have at home. |
| 2:00 | ~20 | I reached the sign-in step ("Keep your plans safe"), then "You're set". |
| 2:15 | 21 | "Plan your first cook" opened **next week**, with a banner telling me Wednesday's cook had passed. I had to work out that I should tap "Plan a cook for today". |
| 4:30 | ~30 | I chose Efo Riro and Party Jollof plus Akara with Pap, and tapped "Cook planned · 9 meals from Thursday to Saturday." **This was the first useful result: about 4.5 minutes and 30 taps in.** |
| 5:30 | ~35 | Shopping list: 20 items, grouped by aisle, each showing which dish uses it. This was the moment I believed in the app. |
| 7:00 | ~40 | Cook day: 21 steps, one recipe after another, with working timers. The last screen, "Portion and store", said which meal goes in which container. |

---

## 3. What works, and why

- **The cook-days picker explains itself as you tap.** After I picked Sun and Wed it said "Sunday's cook covers Sunday to Tuesday. Wednesday's covers Wednesday to Saturday." That one sentence teaches the whole idea of the app. A fourth day is quietly blocked, and the hint changes to "That's the most."
- **The shopping list is excellent.** It is grouped by where you buy things (Produce, Protein, Dairy, Carbs, Spices) with a count per group. Each item shows the dishes that need it ("Onions 8 · Akara with Pap, Efo Riro with Beef…"). Things you have at home are hidden in a collapsed "Already at home" section. Typing an item that isn't on the list ("toilet roll") offers to add it, then confirms "Added Toilet roll under Other." Marking butter as Low in the kitchen list put it under "Running low at home" on the shopping list. Most grocery apps don't connect these parts this well.
- **Swapping a meal shows "least extra shopping first".** When I tapped a meal on the plan, the other recipes were listed with notes like "Uses 5 fresh things already on your list". This is the right way to rank options for someone on a budget.
- **"Use it up" on the next cook.** When I planned Sunday, the top row was "These use fresh food you bought for Thursday's cook." That's clever and saves money.
- **Timers.** "40 minute timer · Start" turned into a pill at the top of the screen ("Efo Riro 39:57") that stayed there on other steps and after a reload. Tapping the pill took me back to that step. "Running. It stays at the top while you carry on." says exactly what is happening.
- **The avoid list works everywhere.** My typed recipe containing okra powder was flagged when I saved it ("Contains okra, which you don't eat."), on its recipe page, and as "Has okra" on its card in the planner. Adding Beef in Settings immediately flagged Efo Riro on a cook I had already planned.
- **What can I make?** gives honest results: "You have chicken thighs, tomatoes, tatashe and 2 more", plus swap tips like "Use vegetable oil instead of palm oil (changes the taste)".
- **Flavour bases in the library.** "Pepper base · Make it once: Blend the peppers, tomatoes and onions in one go, fry it down once, then divide it." This is real batch-cooking advice that a beginner wouldn't know.
- **Honesty about the account.** The landing page says up front that the one-order cook day needs a free account. The sign-in step comes last in setup and gives a reason (plans follow you to other devices). The privacy page is plain and specific: what is stored where, and that captions are sent to Google Gemini's free tier.
- **Delete is safe.** Deleting a saved recipe asks for confirmation on the page itself: "Delete this recipe? It also comes out of any cook it's planned in… This can't be undone. Keep it / Delete."
- **Basics.** Every button and link I measured was at least 40 px tall. Day and food chips report their on/off state to screen readers. I found no low-contrast text on the plan screen. Nothing scrolled sideways at phone width.

---

## 4. What got in my way

Ordered from most to least costly for a new user.

### 4.1 Preppy picks the wrong cook in three places. **Stops a new user.**
- **Where:** "You're set" → Plan your first cook (/plan); What can I make? (/what-can-i-make); Shop tab (/shop).
- **What I did / expected / saw:**
  - "Plan your first cook" on a Thursday. I expected to plan today's cook. It opened **Next week** (Sun 15 – Sat 21), with a banner about this week: "Wednesday cook has passed. Cook today to cover Thursday to Saturday." I had to find "Back to this week" or "Plan a cook for today" myself.
  - What can I make → "Plan it for Sunday's cook" on Nigerian Chicken Stew. I expected Sunday 15 Nov, but the planner's check screen said "Check your cook · **Sun 8 – Tue 10 Nov**", a date that has already passed. (I didn't save it.)
  - After my Thursday cook was done, tapping the Shop tab opened "Sunday cook · Sun 8" (passed), showing "0 of 0 · Nothing to buy yet · Plan this cook". My real list for Sun 15 (16 items) was only reachable from Home's "Go shopping". Before that, Shop had also offered past, unplanned "Sunday cook · Sun 8" and "Wednesday cook · Wed 11" chips. The Sun 8 one has a "Plan this cook" button that opens the planner for that past date.
- **Why it matters:** A shopper who opens Shop in the supermarket sees an empty list and assumes the app has lost their plan. Planning a past date loses the meals without any warning.
- **Direction:** Always default to the next cook that hasn't happened yet, and don't offer planning for dates that have passed.

### 4.2 Sides disappear after you choose them. **Slows or confuses them.**
- **Where:** Plan grid (/plan), Check your cook, Cook day (/plan/cook), shopping list.
- **What I saw:** Setup said "Mains without their own carb get one of these, taking turns through the week." The rotation does happen (the Thursday lunch sheet showed Rice, Friday showed Plantain, and Home shows "Efo Riro with Beef · with yam"). But the plan grid shows no side at all. "Check your cook" doesn't mention sides. None of the 21 cook-day steps (I read all of them) cooks yam, plantain or rice for the stews. The shopping list says "Plantain as needed" and "Yam as needed", with no quantity.
- **Why it matters:** For Nigerian stews the side is half the meal. A new user will either forget it or buy a random amount.
- **Direction:** Show the side on each grid cell, give it a quantity on the list, and include one step for it on cook day.

### 4.3 Meals, portions and containers don't add up. **Slows or confuses them.**
- **Where:** Check your cook, Cook day intro, Portion and store, recipe page.
- **What I saw:** Cooking for 2 people over Thu–Sat, "Check your cook" said "**9 meals**", with each dish "3 meals". Cook day said "Efo Riro **4 portions**, Jollof **6 portions**, Stew **2 portions**". The last step said "Efo Riro · **Fridge (2)**: Thu lunch, Sat lunch". The recipe page defaulted to "**5 servings**".
- **Why it matters:** I couldn't tell how many containers to fill, or whether "9 meals" covered both of us.
- **Direction:** Use one unit everywhere and say who it's for, for example "6 portions (2 people × 3 lunches)".

### 4.4 The fallback cook day doesn't follow its own advice. **Slows or confuses them.**
- **Where:** /plan/cook.
- **What I saw:** The cook-day intro says "Shared base: Pepper base… Blend the peppers, tomatoes and onions in one go, fry it down once, then divide it." The steps that follow then blend peppers three separate times and boil chicken twice (steps 9 and 17). Ingredient amounts are scaled into fractions ("2⅓ Tatashe", "1⅔ Onions", "2⅓ Seasoning cubes", "⅔ Bay leaf"), while the step text still says "an onion, 2 cubes". Some timed steps have a timer and others don't ("cook for 3 minutes" has none).
- **Why it matters:** Recipe-by-recipe order is acceptable as a fallback (the combined order is switched off here), but contradicting the advice one screen earlier undermines trust. Fractions of a pepper are hard to measure.
- **Direction:** Round whole items to something you can measure, make the step text match the scaled amounts, and either move the shared-base advice into the first step or leave it out of the fallback.

### 4.5 Fast taps hit the wrong thing on the shopping list. **Slows or confuses them.**
- **Where:** /shop.
- **What I saw:** A ticked item drops to the bottom of its group straight away. Two quick taps in the same spot ticked "Scotch bonnet" and then "Spinach", which had moved up under my finger.
- **Why it matters:** In a shop, with one hand and moving quickly, this produces wrong ticks and missed items.
- **Direction:** Wait a moment before moving a ticked item, or leave it where it is and just strike it through.

### 4.6 "Repeat last week" does nothing. **Slows or confuses them.**
- **Where:** Plan → next week.
- **What I saw:** "Last week's cooks are planned. Use them again? **Repeat last week**". I tapped it twice and nothing changed, with no message. Both of next week's cooks still said "Not planned".
- **Inference:** Last week had a single Thursday cook while next week has Sunday and Wednesday cooks, so maybe nothing matched. If so, it should say that.
- **Direction:** Either fill the cooks or explain why it can't.

### 4.7 The intro promises a warning that I never saw. **Small polish.**
- **Where:** /welcome intro ("Keep it interesting… Preppy tells you when two taste the same.")
- **What I saw:** I picked Spaghetti Jollof and Suya Jollof Rice for the same cook and got no warning on the mains step or on Check your cook. Also, a new user never sees this intro at all: Get started on the landing page jumps straight to the first question, and I only reached the intro through Settings → Run setup again.
- **Direction:** Show the warning, or remove the promise.

### 4.8 Setup has no history. **Small polish.**
- **What I saw:** The address stays /welcome for all five steps. The phone's back button on step 2 left setup completely and went back to Settings. A reload on step 2 went back to the intro. The on-screen back arrow does work.
- **Direction:** Make the phone back button go to the previous step.

### 4.9 Smaller things. **Small polish.**
- The landing page is blank except for the logo for about a second on first load, and its feature cards fade in after you scroll, so a fast scroller sees empty boxes for a moment.
- "At home" marks all 91 things I didn't tick as red **OUT**. That reads like a warning that my kitchen is empty, when really I just didn't say.
- After saving a recipe, it sits under "Saved by you" at the very bottom of the library, below "More to browse".
- A recipe page opened from Home has a back link that says "Library".
- The Library search keeps old text ("zzzz", 0 recipes) when you come back to it later by a different route.
- "Type the recipe in instead" carries over the link I typed but drops the caption I had typed. The link field accepted "not a link".
- "Add a recipe" form: the placeholders (Gochujang chicken, Chicken, Korean, a sample ingredient list) are grey but look like filled-in values. The required-field messages are small and grey ("Give the recipe a name."), and "Add at least one ingredient." stayed on screen after I added ingredients.
- Shopping list for Sunday: "Onions 4 + 1 handful", "Tomatoes 5 + 300 g". The units aren't merged. Tatashe and scotch bonnet are listed to buy again, even though "Use it up" suggested Spaghetti Jollof because they were left over from Thursday.
- The plan's day strip (Sun 8 … Sat 14) looks tappable but isn't. Which days belong to which cook is shown only by colour.
- "The orange ones aren't ticked off your shopping list yet" on cook day uses colour alone to carry meaning.
- Dark mode: the app stays light. That's consistent and readable, but bright at night in the kitchen.
- Two times, the first tap on a bottom tab straight after closing a sheet didn't register.

---

## 4b. Words that got in my way

Most costly first.

| Quote | Where | What a stranger takes it to mean | Plainer wording |
|---|---|---|---|
| "9 meals" / "3 meals" vs "4 portions" vs "Fridge (2)" vs "5 servings" | Check your cook; Cook day; Portion and store; recipe page | Four counts that don't match. Is it per person, per container, or per meal slot? | Use one word: "portions". For example "12 portions · 2 people, 3 days" and "Fridge: 2 containers (Thu lunch, Sat lunch)". |
| "Shop before Thursday" | Shop, on Thursday | It's already too late. | "Shop today" / "Shop by Sunday" |
| "Wednesday cook has passed. Cook today to cover Thursday to Saturday." (shown on the **Next week** view) | /plan after setup | A warning about one week shown on a different week. | Show it only on This week. On next week, say "Plan Sunday's cook". |
| "Sweet" (grid) / "dessert" (sheet title, Home, screen-reader label) / "Breakfast and sweets" / "Bfast" | Plan grid, cell sheet, Home | Three names for one meal slot, plus an abbreviation. | Pick one ("Dessert" or "Treat") and write "Breakfast" in full. |
| "Anything you don't eat?" / "Never in my food" / "which you don't eat" | Setup, Settings, warnings | Three names for one list. | "Foods I avoid" everywhere. |
| "Save from Instagram or TikTok without copying", then "circle the caption, and tap Copy" | Add a recipe, Android steps | The title promises no copying, then the steps ask you to copy. | "Save from Instagram or TikTok faster" |
| "From the cupboard: rice, curry powder…" | What can I make? | I can't tell whether I have these or need to buy them. I had marked rice as Out. | "Also needs (from your cupboard): …" with a ✓ next to items you have |
| "None of these dishes have nutrition info." | Check your cook | Sounds like an error or something missing. | Leave it out, or "Nutrition not available for these dishes." |
| "Cooked · open again" | Plan card after cooking | Unclear what reopening does. | "View cook day" |
| "See the timetable" | Cook planned | "Timetable" isn't used anywhere else in the app. | "See the plan" (the word Home uses) |
| "Skip, no sweets this cook" | Breakfast and sweets step | It looks like it only skips sweets, but it skips breakfast too. | "Skip breakfast and sweets" |
| "Pick up to three." appearing twice | Setup step 1 (subtitle + hint) | Repeated. | Keep it in the subtitle only. |
| "Peeled beans (for moi moi)" for Akara with Pap | Shopping list | Confusing, because I'm not making moi moi. | "Peeled beans" |
| "Recipe" pill on every card | Planner cards | Looks like a label, but it's actually the link to the recipe. | "View recipe", or an icon with that label |
| Tags "Spicy Garlic", "Banana", "Chocolate" next to "Nigerian", "Chinese" | Planner cards | Flavour and cuisine mixed in one slot. | Separate the flavour from the cuisine. |
| "out of the library if you shared it" | Delete confirmation | Mentions sharing, which I never saw. | Show that part only for recipes that have been shared. |

**Copy that works, and why**
- "Sunday's cook covers Sunday to Tuesday. Wednesday's covers Wednesday to Saturday." It explains the whole idea of the app as you make the choice.
- "Fresh food is always on the list, because it doesn't keep." Says what happens and why in one line.
- "Running. It stays at the top while you carry on." Tells you exactly what the timer will do.
- "Uses 5 fresh things already on your list" and "least extra shopping first". Concrete and money-minded.
- "These use fresh food you bought for Thursday's cook." Shows the app remembers what you bought.
- "Use vegetable oil instead of palm oil (changes the taste)". An honest swap.
- "Added Toilet roll under Other." Confirms the action and says where it went.
- "Nothing matches / Try another word, or clear the filter." The empty state says what to do next.
- Privacy page: short sections, concrete facts, no legal fog.

---

## 5. What's missing

Ranked. Each one names who would miss it and when.

1. **Sides as real items on the plan, the list and cook day.** Anyone cooking stews or soups would miss this on cook day, standing over the pot with nothing to serve it with. (Mealime and Samsung Food list every component.)
2. **One clear count of portions and containers.** Anyone cooking for more than one person, at the "Portion and store" step.
3. **Adding a library recipe to a cook from the recipe page.** Someone browsing the library on a Tuesday night who finds a dish they like. Right now the recipe page has no "Add to a cook" button, and you have to go back through the planner. Paprika and Plan to Eat both have this.
4. **Editing a saved recipe.** Anyone who mistypes a quantity. Today the only options are view or delete.
5. **Clearing my data without an account.** Anyone who tries the app on a shared device. The privacy page says signing out clears the device, but without an account there is no way to do that.
6. **Leftovers counted against the next shopping list.** The budget-minded user on their second week, when "Use it up" suggests a dish and the list then asks them to buy the same peppers again.
7. **Sharing the list with someone else who shops.** A couple splitting the shopping on Saturday. Most grocery apps let you send the list.

---

## 6. Feature by feature

| Where | What I expected | What it did | Clear? | Worth having? |
|---|---|---|---|---|
| Landing /start | A pitch and a start button | Clear headline, four feature cards, home-screen install steps, Privacy link | yes | yes |
| Setup: cook days + people | Pick days and household size | Up to 3 days, live sentence explaining coverage, stepper | yes | yes |
| Setup: foods to avoid | Allergies and dislikes | 20 chips + free text, Enter adds, duplicates ignored, very long items accepted | yes | yes |
| Setup: sides | Pick carbs | 24 chips + free text, typing an existing one selects it | partly (what happens next isn't visible later) | yes |
| Setup: kitchen | What I have | 24 dry goods, no free text (unlike the two previous steps) | yes | yes |
| Setup: sign-in step | Account prompt | Reason given; accounts off here | yes | yes |
| You're set | Next step | Plan your first cook / Go home | yes | yes |
| Plan, week view | My week | Day strip (not tappable), banner, cook cards, week arrows, Back to this week | partly | yes |
| Planner: mains | Pick dishes | Search (also matches ingredients), cuisine chips, cards with avoid flags, "Use it up" row | yes | yes |
| Planner: breakfast and sweets | Optional extras | Pick or skip | partly (naming) | yes |
| Check your cook | Summary | Meal count, dish list | partly (units) | yes |
| Plan grid + cell sheet | See and swap meals | Grid; sheet with swap options, "least extra shopping first", Serve with sides, Clear this meal | yes | yes |
| Edit this cook | Change dishes | Not opened in depth | — | unclear |
| Repeat last week | Copy last week | Did nothing visible | no | unclear |
| Shop: To buy | List for the next cook | Grouped, per-dish sources, add item, Running low, Already at home | yes | yes |
| Shop: cook chips | Switch between cooks | Includes passed cooks; default can be a passed one | no | yes |
| Shop: At home | My kitchen | 96 items, Have/Low/Out sheet, feeds the list | partly (everything defaults to Out) | yes |
| Cook day intro | What to get ready | Dishes, fresh items, shared base tip | yes | yes |
| Cook day steps | Guided cooking | 21 steps, timers that persist, Back/Next | partly | yes |
| Portion and store | Where food goes | Fridge per dish with meal slots | partly | yes |
| Home | Today and the next cook | Getting started list, Next cook, Today with sides, Go shopping | yes | yes |
| Recipe page | Recipe + scale it | Ingredients, servings stepper with reset, method, credit | yes | yes |
| Library | Browse | Flavour bases, cuisines, all, breakfast, Saved by you | yes | yes |
| Flavour base page | Group of dishes | Explanation, "Make it once" tip, dishes | yes | yes |
| Add a recipe: from a post | Paste a post | Link + caption, clear error when empty, how-to for iPhone/Android | partly | yes |
| Add a recipe: type it in | Manual entry | Full form, saved with avoid warning | yes | yes |
| Saved recipe page | Manage my recipe | View, scale, delete with confirm; no edit | yes | yes |
| What can I make? | Ideas from my fridge | Chips → ranked dishes with have/need/swap; plan or add to list | yes | yes |
| Settings | Change setup | People, cook days, avoid, sides, run setup again | yes | yes |
| Account /account | Sign in | Explanation; accounts off | yes | yes |
| Privacy | What's kept | Plain, specific | yes | yes |

---

## 7. Questions a new user would still have

- How much food do I actually make: per person, per container, per day?
- What do I serve with the stew, and how much yam or plantain should I buy?
- Which cook is the Shop tab showing me, and why is it empty?
- Can I put a recipe I'm looking at straight into a cook?
- Does Preppy remember what I bought but didn't use?
- How do I start over or wipe my data on this phone?
- What does "Repeat last week" do?
- Where is "share", which the delete message mentions?

---

## 8. Could not test

- **Signing in and syncing across devices.** Accounts are switched off in this setup.
- **The combined cooking order** (all dishes in one order, plus the freezer advice). Switched off here; I judged only the recipe-by-recipe fallback.
- **Reading a recipe from an Instagram or TikTok post.** Switched off here; I judged only the screen and its instructions.
- **"New from other cooks" in the library and sharing a recipe with everyone.** Both need accounts.
- **The iPhone "Get the Preppy shortcut" link.** It downloads a file (/save-to-preppy.shortcut), so I didn't tap it.
- **A real phone keyboard covering fields.** The browser emulation doesn't show an on-screen keyboard.
- **Reloading in the middle of the very first setup.** I tested a reload on "Run setup again" instead, where my earlier answers were already saved. Whether a brand-new user loses their answers on reload is unverified.
- **Edit this cook, Clear this meal, "Add 3 to my list" in What can I make?, and Delete (confirmed) on a saved recipe.** I opened these or got close but didn't complete them, to stay within budget.

---

## 9. If I could change only five things before a hundred strangers use it

1. Always open on the next upcoming cook (in the planner after setup, in What can I make, and in Shop), and never offer to plan a date that has passed.
2. Show the side on every plan cell, give it a quantity on the list, and give it a step on cook day.
3. Use one unit for amounts ("portions", saying how many people) from Check your cook through to Portion and store.
4. Stop ticked shopping items moving under the shopper's finger.
5. Use one name each for the dessert slot ("Sweet/dessert/sweets/Bfast") and for the avoid list, and fix "Shop before Thursday" on a Thursday.

---

## 10. Go live?

**Yes, after these fixes:**
- The Shop tab defaults to a past, empty cook, and "Plan it for Sunday's cook" in What can I make plans last Sunday. Either can make a new user think their plan is gone or plan meals for days that have passed.
- Sides are chosen during setup but never appear on the plan grid, on cook day, or with a quantity on the shopping list.

Everything else in this report can follow after launch.

---

## 11. Technical errors seen

- **Recipe page (/library/[id]), in the console:** a Next.js development error, "Route "/library/[id]": Next.js encountered URL data during prerendering or a navigation", raised from RecipePage. It had no visible effect on the page.
- **Add a recipe → Read recipe:** `POST /api/read-recipe` → 503. Expected, because reading posts is switched off.
- **Cook day → Work out my cooking order:** `POST /api/cook-order` → 503. Expected, because the combined order is switched off.
- No other failed requests were seen in the requests the tab kept.
