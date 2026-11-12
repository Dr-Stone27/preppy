"use client";

/**
 * Usage tracking with PostHog: screens opened and a handful of named steps, nothing typed.
 * Does nothing until a PostHog project token is set, and loads the library only then.
 * No autocapture, no session recordings, no cookies (it keeps its id in localStorage).
 */
import type { PostHog } from "posthog-js";

// The Vercel PostHog integration sets NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN; older setups used _KEY or _TOKEN.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export type Event =
  | "landing_viewed"
  | "landing_get_started"
  | "setup_started"
  | "setup_done"
  | "signed_in"
  | "round_planned"
  | "recipe_read"
  | "recipe_saved"
  | "cook_day_opened"
  | "list_item_added"
  | "what_can_i_make_opened"
  | "account_deleted"
  | "recipe_shared"
  | "recipe_unshared"
  | "shared_recipe_saved"
  | "recipe_reported";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: (() => void)[] = [];

function load(): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        persistence: "localStorage",
        person_profiles: "identified_only",
        capture_pageview: "history_change",
        capture_pageleave: false,
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
      });
      client = posthog;
      queue.splice(0).forEach((f) => f());
      return posthog;
    })
    .catch(() => null);
  return loading;
}

function run(f: (p: PostHog) => void) {
  if (!KEY || typeof window === "undefined") return;
  if (client) return f(client);
  queue.push(() => client && f(client));
  void load();
}

/** Starts tracking (and the first page view) as soon as the app opens. */
export const startAnalytics = () => void load();

export function track(event: Event, props?: Record<string, string | number | boolean>) {
  run((p) => p.capture(event, props));
}

/** Links this browser's events to the account by its id only. Never the email. */
export function identify(userId: string) {
  run((p) => p.identify(userId));
}

export function forget() {
  run((p) => p.reset());
}
