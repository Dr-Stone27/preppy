"use client";

/**
 * Usage tracking with PostHog: meaningful user actions and completion steps, never typed content.
 * The shared client is initialized once in instrumentation-client.ts.
 */
import posthog from "posthog-js";

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

export type Event =
  | "landing_get_started"
  | "setup_started"
  | "setup_done"
  | "sign_in_link_requested"
  | "signed_in"
  | "account_deleted"
  | "recipe_read"
  | "recipe_saved"
  | "recipe_deleted"
  | "round_planned"
  | "cook_order_generated"
  | "cooking_completed"
  | "meal_customized";

export function track(event: Event, props?: Record<string, string | number | boolean>) {
  if (isConfigured) posthog.capture(event, props);
}

/** Links this browser's events to the account id; email is a person property, never an event property. */
export function identify(userId: string, email?: string) {
  if (!isConfigured) return;
  if (email) posthog.identify(userId, { email });
  else posthog.identify(userId);
}

export function forget() {
  if (isConfigured) posthog.reset();
}
