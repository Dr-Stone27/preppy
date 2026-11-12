import { aiError, geminiJson, guard, type Image } from "@/server/gemini";
import { pantryItems } from "@/domain/shop/pantry";

const MAX_IMAGE_CHARS = 1_500_000; // about 1.1 MB of JPEG; the app shrinks photos well below this
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function prompt() {
  const names = pantryItems()
    .filter((p) => p.fresh)
    .map((p) => p.name)
    .sort()
    .join(", ");
  return `This is a photo of someone's fridge, kitchen counter or shopping. List the fresh food you can clearly see: meat, fish, eggs, vegetables, fruit, herbs, dairy, bread, yams, plantain and the like.

Leave out packaged sauces, drinks, condiments and anything you can't identify with confidence. Do not guess at what might be behind something.

When an item is the same thing as one in this list, use the list's name exactly: ${names}

Reply with only JSON: {"items": [string]} with at most 30 items, most obvious first. If you can't see any food, reply {"items": []}.`;
}

/** Reads the fresh food in a photo, for "What can I make?". Counts against the same daily AI allowance. */
export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  let body: { image?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const i = body.image as Image | undefined;
  if (!i || typeof i !== "object" || !IMAGE_TYPES.includes(i.mime) || typeof i.data !== "string" || i.data.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(i.data)) {
    return Response.json({ error: "bad-image" }, { status: 413 });
  }
  try {
    const out = (await geminiJson(prompt(), AbortSignal.timeout(45_000), [{ mime: i.mime, data: i.data }])) as { items?: unknown };
    const items = Array.isArray(out?.items) ? out.items.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean).slice(0, 30) : [];
    return Response.json({ items });
  } catch (e) {
    return aiError(e);
  }
}
