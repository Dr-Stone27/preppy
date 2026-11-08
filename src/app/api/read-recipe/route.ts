import { aiError, geminiJson, guard, type Image } from "@/server/gemini";
import { GROUPS, pantryItems } from "@/domain/shop/pantry";

const MAX = 8000;
const MAX_IMAGES = 4;
const MAX_IMAGE_CHARS = 1_500_000; // about 1.1 MB of JPEG each; the app shrinks screenshots well below this
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function prompt(link: string, text: string, never: string[], screenshots: number) {
  const pantry = pantryItems()
    .map((p) => p.name)
    .sort()
    .join(", ");
  return `You turn a recipe from a social media post into structured data for a batch meal-prep planner. The cook lives in Nigeria and cooks in batches a few times a week.

${screenshots ? `${screenshots === 1 ? "A screenshot" : `${screenshots} screenshots`} of the post ${screenshots === 1 ? "is" : "are"} attached. Read the recipe from the caption text in ${screenshots === 1 ? "it" : "them"}; ignore usernames, like and comment counts, buttons and anything else on screen. If the caption continues across screenshots, join it in order.

` : ""}The input is a caption, a transcript, or a rough note. If it is only a rough note, fill in a sensible standard version of the dish and set "inferred" to true. Keep the original dish; do not swap in different ingredients unless one is missing.

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
  let body: { text?: unknown; link?: unknown; never?: unknown; images?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX) : "";
  const link = typeof body.link === "string" ? body.link.trim().slice(0, 300) : "";
  const never = Array.isArray(body.never) ? body.never.filter((x): x is string => typeof x === "string").slice(0, 40) : [];
  const raw = Array.isArray(body.images) ? body.images : [];
  const images: Image[] = raw
    .slice(0, MAX_IMAGES)
    .filter((i): i is Image => !!i && typeof i === "object" && IMAGE_TYPES.includes((i as Image).mime) && typeof (i as Image).data === "string")
    .filter((i) => i.data.length <= MAX_IMAGE_CHARS && /^[A-Za-z0-9+/=]+$/.test(i.data));
  if (raw.length > MAX_IMAGES || images.length !== raw.length) return Response.json({ error: "bad-image" }, { status: 413 });
  if (!text && !images.length) return Response.json({ error: "empty" }, { status: 400 });
  try {
    return Response.json({ recipe: await geminiJson(prompt(link, text || "(the caption is in the screenshots)", never, images.length), AbortSignal.timeout(55_000), images) });
  } catch (e) {
    return aiError(e);
  }
}
