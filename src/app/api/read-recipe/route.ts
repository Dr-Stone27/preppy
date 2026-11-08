import { aiError, geminiJson, guard } from "@/server/gemini";
import { GROUPS, pantryItems } from "@/domain/shop/pantry";

const MAX = 8000;

function prompt(link: string, text: string, never: string[]) {
  const pantry = pantryItems()
    .map((p) => p.name)
    .sort()
    .join(", ");
  return `You turn a recipe from a social media post into structured data for a batch meal-prep planner. The cook lives in Nigeria and cooks in batches twice a week.

The input is a caption, a transcript, or a rough note. If it is only a rough note, fill in a sensible standard version of the dish and set "inferred" to true. Keep the original dish; do not swap in different ingredients unless one is missing.

When an ingredient is the same thing as one in this pantry list, use the pantry name exactly: ${pantry}

The cook never eats: ${never.join(", ") || "nothing listed"}. Seafood includes oyster sauce, fish sauce, shrimp paste and crayfish. If the recipe uses any of them, list each in "flags" and do not remove it. Leave water out of the ingredients.

Reply with only one JSON object in this shape:
{"title": string, "kind": "main" | "sweet", "protein": string, "flavour": string, "servings": number, "withCarb": boolean, "ingredients": [{"name": string, "qty": number | null, "unit": string, "group": one of ${JSON.stringify(GROUPS)}}], "steps": [string], "flags": [string], "inferred": boolean, "macros": {"kcal": number | null, "protein": number | null, "carbs": number | null, "fat": number | null} | null}

"kind" is "main" for lunch or dinner dishes and "sweet" for breakfasts, desserts and snacks. "flavour" is a short cuisine or sauce label such as Korean, BBQ, Curry, Suya, Chinese, Nigerian. "withCarb" is true when the dish already includes its own rice, pasta, noodles, bread or other carb, so it needs no side. When a post gives both imperial and metric amounts, use the metric one; otherwise keep the units as written. qty is null when no amount is given. Ignore promotions, discount codes, hashtags and calls to comment. "macros" are per serving and only when the post states them (approximate figures like "~310" count); otherwise null. Use null for any single figure the post doesn't give, never 0 as a placeholder. Do not estimate macros.

Link: ${link || "none"}
Post text:
"""
${text}
"""`;
}

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  let body: { text?: unknown; link?: unknown; never?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX) : "";
  const link = typeof body.link === "string" ? body.link.trim().slice(0, 300) : "";
  const never = Array.isArray(body.never) ? body.never.filter((x): x is string => typeof x === "string").slice(0, 40) : [];
  if (!text) return Response.json({ error: "empty" }, { status: 400 });
  try {
    return Response.json({ recipe: await geminiJson(prompt(link, text, never), AbortSignal.timeout(55_000)) });
  } catch (e) {
    return aiError(e);
  }
}
