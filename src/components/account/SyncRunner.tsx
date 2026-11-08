"use client";

import { useSync } from "@/state/sync";

/** Mounted once in the app frame so sign-in and saving run on every screen. */
export function SyncRunner() {
  useSync();
  return null;
}
