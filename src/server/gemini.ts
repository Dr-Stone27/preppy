/**
 * Minimal Gemini call over REST. The key stays on the server.
 * GEMINI_MODEL can change without a code change, since model names move often.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export class AiUnavailable extends Error {}

async function call(key: string, prompt: string, thinking: boolean, signal?: AbortSignal) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        // Reading a caption needs little reasoning; Gemini 3 thinks at "high" by default, which is slow.
        ...(thinking ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
      },
    }),
    signal,
  });
}

export async function geminiJson(prompt: string, signal?: AbortSignal): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;
  if (!key) throw new AiUnavailable("not-configured");
  let res = await call(key, prompt, true, signal);
  // Older models don't know thinkingLevel; ask again without it.
  if (res.status === 400) {
    const detail = await res.text();
    if (/thinking/i.test(detail)) res = await call(key, prompt, false, signal);
    else throw new Error(`gemini 400 ${MODEL}: ${detail.slice(0, 300).replace(/\s+/g, " ")}`);
  }
  if (res.status === 429) throw new AiUnavailable("busy");
  if (!res.ok) {
    // Google's error text names the problem (bad model, quota) and never echoes the key.
    const detail = (await res.text()).slice(0, 300).replace(/\s+/g, " ");
    throw new Error(`gemini ${res.status} ${MODEL}: ${detail}`);
  }
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    throw new Error(`gemini reply was not JSON (${MODEL}): ${text.slice(0, 120)}`);
  }
}

/** Best-effort guard against other sites using this endpoint, and against bursts from one address. */
const hits = new Map<string, number[]>();
export function guard(req: Request): Response | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 8) return Response.json({ error: "busy" }, { status: 429 });
  hits.set(ip, [...recent, now]);
  return null;
}

export function aiError(e: unknown): Response {
  console.error("[ai]", e instanceof Error ? e.message : e);
  if (e instanceof AiUnavailable) {
    return Response.json({ error: e.message }, { status: e.message === "busy" ? 429 : 503 });
  }
  return Response.json({ error: "failed" }, { status: 502 });
}
