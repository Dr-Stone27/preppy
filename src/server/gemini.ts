/**
 * Minimal Gemini call over REST. The key stays on the server.
 * GEMINI_MODEL can change without a code change, since model names move often.
 */
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  // Tried when the first model is overloaded or rate-limited.
  process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest",
];

export class AiUnavailable extends Error {}

async function call(model: string, key: string, prompt: string, thinking: boolean, signal?: AbortSignal) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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

async function once(model: string, key: string, prompt: string, signal?: AbortSignal): Promise<Response> {
  const res = await call(model, key, prompt, true, signal);
  // Older models don't know thinkingLevel; ask again without it.
  if (res.status === 400) {
    const detail = await res.text();
    if (/thinking/i.test(detail)) return call(model, key, prompt, false, signal);
    return new Response(detail, { status: 400 });
  }
  return res;
}

export async function geminiJson(prompt: string, signal?: AbortSignal): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;
  if (!key) throw new AiUnavailable("not-configured");
  let res: Response | null = null;
  let model = MODELS[0];
  for (const [i, m] of MODELS.entries()) {
    model = m;
    const last = i === MODELS.length - 1;
    // An overloaded model can hang instead of saying so; give each one a share of the time.
    const attempt = last ? signal : AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20_000)]);
    try {
      res = await once(model, key, prompt, attempt);
    } catch {
      if (last || signal?.aborted) {
        console.error(`[ai] ${model} took too long`);
        throw new AiUnavailable("busy");
      }
      console.error(`[ai] ${model} took too long, trying the next model`);
      continue;
    }
    if (res.status !== 503 && res.status !== 429) break;
    console.error(`[ai] ${model} busy (${res.status}), trying the next model`);
  }
  if (!res || res.status === 503 || res.status === 429) throw new AiUnavailable("busy");
  if (!res.ok) {
    // Google's error text names the problem (bad model, quota) and never echoes the key.
    const detail = (await res.text()).slice(0, 300).replace(/\s+/g, " ");
    throw new Error(`gemini ${res.status} ${model}: ${detail}`);
  }
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    throw new Error(`gemini reply was not JSON (${model}): ${text.slice(0, 120)}`);
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
