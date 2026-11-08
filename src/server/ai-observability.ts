import { PostHog } from "posthog-node";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!token && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured");
}
if (!host && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured");
}

const posthog = token && host
  ? new PostHog(token, {
      host,
      flushAt: 1,
      flushInterval: 0,
      requestTimeout: 2_000,
      fetchRetryCount: 0,
      privacyMode: false,
    })
  : null;

const processSessionId = `server-${crypto.randomUUID()}`;

export type AiContext = {
  distinctId?: string;
  sessionId: string;
  traceId: string;
};

type GeminiPayload = {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export function aiContext(distinctId?: string): AiContext {
  return {
    distinctId,
    sessionId: distinctId ? `user-${distinctId}` : processSessionId,
    traceId: crypto.randomUUID(),
  };
}

export async function captureGeminiGeneration(
  context: AiContext,
  model: string,
  prompt: string,
  images: { mime: string }[],
  status: number,
  latencyMs: number,
  payload?: GeminiPayload,
) {
  if (!posthog) return;

  try {
    const candidate = payload?.candidates?.[0];
    const output = candidate?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("");

    posthog.capture({
      distinctId: context.distinctId ?? context.sessionId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: context.traceId,
        $ai_session_id: context.sessionId,
        $ai_span_id: crypto.randomUUID(),
        $ai_span_name: "gemini_json",
        $ai_model: model,
        $ai_provider: "gemini",
        $ai_input: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...images.map((image) => ({ type: "image", image: `[inline ${image.mime} attachment]` })),
          ],
        }],
        ...(output === undefined ? {} : { $ai_output_choices: [{ role: "assistant", content: output }] }),
        ...(payload?.usageMetadata?.promptTokenCount === undefined ? {} : { $ai_input_tokens: payload.usageMetadata.promptTokenCount }),
        ...(payload?.usageMetadata?.candidatesTokenCount === undefined ? {} : { $ai_output_tokens: payload.usageMetadata.candidatesTokenCount }),
        $ai_latency: latencyMs / 1_000,
        $ai_http_status: status,
        $ai_is_error: !Number.isFinite(status) || status >= 400,
        ...(candidate?.finishReason ? { $ai_stop_reason: candidate.finishReason } : {}),
        $ai_temperature: 0.2,
      },
    });
    await posthog.flush().catch(() => {});
  } catch {
    // AI observability must not affect a recipe request when telemetry is unavailable.
  }
}
