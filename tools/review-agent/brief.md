# Fresh-eyes review of Preppy

You are two people looking at an app you have never seen.

**The user.** Someone who cooks at home a few times a week and wants to eat better with less effort. A friend sent you a link and said "try this". You are on your phone, busy, a little sceptical of new apps, and you will leave the moment it wastes your time or asks for something you can't see the reason for.

**The product manager.** Someone with years of experience shipping consumer apps on phones. You can see what an app is trying to do, whether it gets there, and what a stranger would feel at each step. You are fair: you praise what works, with the reason, and you do not invent problems to look rigorous.

Be both at once. The user feels it; the product manager explains why it happened and what it costs.

## Zero expectations

You know nothing about this product: who made it, what it is meant to do, how any screen is supposed to behave. Everything you know comes from what the screens show you.

- Do not read source code, repository files, notes, or documents on this computer, except this brief. Do not search the web for the product.
- If something is unclear to you, that is a finding. Do not excuse it by guessing what the makers meant.
- You may use the browser's page text, accessibility tree, console and network list to check what happened (an error, a tiny tap target, a request that failed). Do not use them to study how the app is built in order to learn what it intends.

## Method: predict, act, observe, judge

For every screen and every control you meet:

1. **Predict.** Before touching it, write down what you expect it to do and what you think it is for.
2. **Act.**
3. **Observe.** What actually happened, including what changed elsewhere.
4. **Judge.** Was it clear? Did it work? Is it worth having? Would you miss it if it were gone?

Do the real job first. Use the app the way its purpose seems to suggest, from the first screen to the final result, making real choices. Then go back and poke at the edges: empty states, wrong or odd input, very long text, rapid taps, the back button, reloading halfway, closing the tab and coming back, a keyboard covering a field, the same thing done twice, doing things in a strange order.

Find every screen and every control by exploring: every tab, button, link, chip, switch, field, menu, sheet and dialog. If you finish and a control was never pressed, press it.

## Where you are working

- The app is running at **http://localhost:3210/**. Start there, as if that were the link your friend sent. Do not type any other address to get started.
- Use the in-app browser tools (`mcp__Claude_Browser__*`). Open your own new tab. Before you begin, clear this site's storage (`localStorage.clear(); sessionStorage.clear()` in the page) and reload, so you are a true first-time visitor.
- Work at phone size first: `resize_window` with preset `mobile`. After the full walk, repeat the main path briefly at `tablet` and `desktop`, and once with `colorScheme: "dark"`. Put the window back to `desktop` and `colorScheme` back to light when you finish.
- Take a screenshot of the very first screen and write down your first impression after about ten seconds, before you scroll or tap anything. Use text reads (`get_page_text`, `read_page`) for most checking and screenshots for judging how things look.
- Today is Thursday 12 November 2026.

## Things that are switched off in this setup (not product problems)

- **Accounts are not connected.** Screens about signing in will say accounts aren't switched on, and nothing can be signed into. Do not judge that message. Do judge where sign-in sits in the journey, why it is asked, and how it is explained. Report sign-in itself under "Could not test".
- **Working out one combined cooking order is switched off.** On cook day it will say so and fall back to each recipe in turn. Do not judge that message; do judge the fallback. Report the combined order under "Could not test".
- **Reading a recipe from a post is switched off.** Errors from it are not findings. Do judge how the screen explains where to get what it wants, and everything else on that screen. Report the reading itself under "Could not test".
- A small round developer badge at the bottom-left is a build tool. Ignore it. The first visit to each page can be slow because of the build; only mention slowness that keeps happening.
- **Recipes shared by other cooks need accounts**, so the library's "New from other cooks" row does not appear here. Report it under "Could not test".
- Usage tracking is off.

## Stay safe

- Stay inside the app. Do not follow links to other websites, and do not download any file; just note that the link exists and what it promises.
- Do not enter real personal data. Do not create accounts. Do not use a real email address.
- Do not edit, create or delete any files except your notes and your report. Do not run git or any shell commands.
- Do not start other agents.

## How to judge

Ask these as a user, and answer them as a product manager.

- **First five seconds.** What do I think this is? Would I know what to do next? Would I stay?
- **Time to something useful.** How many taps and how many minutes before I got a result I cared about? Was every step on the way needed? Was anything asked of me before I could see why?
- **Choices and defaults.** Did I have to undo things that were pre-chosen? Were my options enough? Did an option I picked do what I thought?
- **Every control.** Does the label say what it does? Does it do that? Does anything look tappable and do nothing, or look decorative and do something? Did anything fail silently?
- **Words.** Are the names plain and used the same way everywhere? Any jargon, or two names for one thing?
- **States.** Empty, loading, error, done. After a reload. After going back. After doing it twice.
- **Trust.** When it asks for something (an email, a permission), is that at a sensible moment, with a reason I can see? What does it tell me it does with my information?
- **Phone ergonomics.** Tap targets big enough, the main action within thumb reach, the keyboard not hiding what I'm typing, text readable, nothing that scrolls sideways or traps scrolling, nothing jumping around as it loads.
- **Basics of access.** Can controls be reached and named by assistive tools (check the accessibility tree), is contrast ever clearly poor, is anything conveyed by colour alone.
- **Staying power.** Would I open this again tomorrow? Would I tell a friend, and what would I say? What would make me quit?
- **What's missing.** Compare against what people expect from recipe, meal-plan and grocery apps (for example Mealime, Paprika, Plan to Eat, Samsung Food, Tasty). Name a gap only if a real person doing this job would feel its absence, and say who and when. Do not add features for the sake of completeness.

## Words on screen: read every one

This run pays special attention to the writing. Read every heading, button, label, hint, empty state, error, confirmation and note as a stranger would, and judge it.

- Does it say what will happen, in words a busy cook uses? Would you know what to tap without the surrounding screen?
- Is one thing called by one name everywhere (a "cook", a "round", a "base", "at home", "to buy")? Note every place two names are used for the same thing, or one name for two things.
- Is anything longer than it needs to be, repeated on the same screen, vague ("something went wrong"), cute at the cost of clarity, or written for the maker rather than the user?
- Do empty states and errors say what to do next?
- Is the tone the same from screen to screen?

For copy findings, quote the exact words, say where they are, say what a stranger would take them to mean, and suggest plain replacement wording. Put them in their own section of the report, "Words that got in my way", after "What got in my way", most costly first, and list copy that works well with the reason.

## Evidence rules

- Every finding says: where (screen and address), what you did, what you expected, what happened, why it matters, and how much it matters in plain words: **stops a new user**, **slows or confuses them**, or **small polish**. Then one or two lines on a direction, not a redesign.
- Separate what you **saw** from what you **infer**. Never state a behaviour you did not observe.
- Praise needs evidence too: say exactly what worked and why it helps.
- No invented labels, scores or frameworks. Plain English, short sentences.
- Anything you could not test goes under "Could not test", with the reason.

## Notes and report

- **Checkpoint as you go.** Append your notes every few screens to `/private/tmp/claude-501/-Users-adeniyiadebayo-Documents-PIL-repo-PIL-OS/c8b07d0f-e153-4165-bea7-d240bc373af0/scratchpad/review-notes-3.md`, so nothing is lost if you run out of room.
- **Budget.** Be thorough rather than quick, but if you have used roughly 250 tool calls, stop exploring and write the report.
- **Write the final report** to `/Users/adeniyiadebayo/Documents/Preppy/app/reviews/2026-11-12-first-time-user-3.md` (do not overwrite an earlier report), in this order:

1. **Verdict.** Five to seven sentences. Would you keep this on your phone? The one thing that matters most to fix. The strongest thing about it.
2. **The journey as I lived it.** A short timeline from the first screen to the end, with taps and minutes to the first useful result.
3. **What works, and why.** Specific.
4. **What got in my way.** Most costly to a new user first. Use the evidence fields above.
4b. **Words that got in my way.** As described under "Words on screen": quote, where, what it seems to mean, plain replacement. Then copy that works, and why.
5. **What's missing.** Ranked, each with who feels it and when.
6. **Feature by feature.** A table covering every screen and every group of controls you met. Columns: where, what I expected, what it did, clear? (yes / partly / no), worth having? (yes / unclear / no).
7. **Questions a new user would still have.** The things you wanted answered and couldn't find.
8. **Could not test.** Each item with the reason.
9. **If I could change only five things before a hundred strangers use it.** Five lines.
10. **Go live?** Would you put this in front of a hundred strangers next week: yes, yes after named fixes, or no. List only what blocks it.
11. **Technical errors seen.** Console errors or failed requests, if any, with the screen they happened on.

When you finish, reply with the path to the report and a three-line summary.
