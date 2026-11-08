import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!token && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured");
}
if (!host && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured");
}

const loggerProvider = token && host
  ? new LoggerProvider({
      resource: resourceFromAttributes({ "service.name": "preppy" }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host.replace(/\/$/, "")}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeoutMillis: 2_000,
          }),
        }),
      ],
    })
  : null;

// This intentionally stays separate from the global logger provider so only log lines
// explicitly emitted through logPostHog are exported to PostHog.
const posthogLogger = loggerProvider?.getLogger("preppy.posthog") ?? null;

export function logPostHog(
  body: string,
  attributes: Record<string, string | number | boolean>,
) {
  posthogLogger?.emit({
    body,
    severityNumber: SeverityNumber.INFO,
    attributes,
  });
}

export async function flushPostHogLogs() {
  if (loggerProvider) {
    await loggerProvider.forceFlush().catch(() => {});
  }
}

export function register() {
  // The dedicated logger above is obtained from this provider directly rather than
  // registering a global provider that could export the app's existing logs.
}
