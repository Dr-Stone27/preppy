import { aiError, geminiJson, guard } from "@/server/gemini";

type Dish = { title: string; portions: number; servings: number; ingredients: string[]; steps: string[] };

function prompt(dishes: Dish[]) {
  return `Plan one batch-cooking session for a home cook in Nigeria with a two-burner stove, an air fryer and a microwave. They are cooking these recipes today, scaled to the portions shown:

${dishes
  .map((d) => `## ${d.title} (cook ${d.portions} portions; the recipe as written makes ${d.servings})
Ingredients: ${d.ingredients.join("; ")}
Steps: ${d.steps.join(" ")}`)
  .join("\n\n")}

Order the work so things run in parallel: start the longest hands-off items first (beans, rice, stews), use the stove and air fryer at the same time, do prep in the gaps, and merge shared prep (chop all the onions at once). Scale amounts to the portions. Include a cooling step before portioning.
Reply with only JSON: {"minutes": number, "steps": [{"title": short imperative, "detail": one or two sentences with scaled amounts, "appliance": "Prep" | "Stove" | "Air fryer" | "Microwave" | "Oven" | "Counter", "recipe": a recipe title or "All", "minutes": number or null (only for timed cooking), "meanwhile": string or null (what is already running)}], "storeTips": [string]}
Use 8 to 16 steps.`;
}

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  let dishes: Dish[];
  try {
    const body = (await req.json()) as { dishes?: Dish[] };
    dishes = (body.dishes ?? []).slice(0, 6).map((d) => ({
      title: String(d.title).slice(0, 120),
      portions: Number(d.portions) || 1,
      servings: Number(d.servings) || 1,
      ingredients: (d.ingredients ?? []).slice(0, 40).map((x) => String(x).slice(0, 120)),
      steps: (d.steps ?? []).slice(0, 30).map((x) => String(x).slice(0, 600)),
    }));
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  if (!dishes.length) return Response.json({ error: "empty" }, { status: 400 });
  try {
    return Response.json({ plan: await geminiJson(prompt(dishes), AbortSignal.timeout(55_000)) });
  } catch (e) {
    return aiError(e);
  }
}
