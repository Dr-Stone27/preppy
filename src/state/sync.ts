"use client";

import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { currentData, type Data, isEmpty, normalise, onUserWrite, replaceData } from "./store";

/**
 * Keeps this browser's data and the signed-in account in step.
 * The whole document is saved after each change (last save wins), which is fine for one person on a couple of devices.
 */
export type SyncState = { status: "off" | "signed-out" | "loading" | "saved" | "saving" | "offline"; email?: string };

const OWNER = "preppy:owner"; // account the local copy belongs to
const DIRTY = "preppy:dirty"; // local changes not yet saved to the account

let state: SyncState = { status: "loading" };
let session: Session | null = null;
let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: SyncState) {
  state = next;
  listeners.forEach((l) => l());
}

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {}
  },
};

/** Guest data joining an account: account wins where both have something. Recipes are combined. */
function merge(local: Data, remote: Data): Data {
  const ids = new Set(remote.recipes.map((r) => r.id));
  return {
    weeks: { ...local.weeks, ...remote.weeks },
    pantry: { ...local.pantry, ...remote.pantry },
    prefs: remote.prefs.onboarded ? remote.prefs : local.prefs,
    recipes: [...remote.recipes, ...local.recipes.filter((r) => !ids.has(r.id))],
  };
}

async function push() {
  const s = supabase();
  if (!s || !session) return;
  set({ ...state, status: "saving" });
  const { error } = await s.from("user_data").upsert({ user_id: session.user.id, data: currentData(), updated_at: new Date().toISOString() });
  if (error) {
    console.error("[sync] save", error.message);
    set({ ...state, status: "offline" });
    return;
  }
  ls.set(DIRTY, null);
  set({ ...state, status: "saved" });
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(push, 1200);
}

/** Bring the account's copy down, or send this device's copy up the first time. */
async function pull() {
  const s = supabase();
  if (!s || !session) return;
  const uid = session.user.id;
  const { data: row, error } = await s.from("user_data").select("data").eq("user_id", uid).maybeSingle();
  if (error) {
    console.error("[sync] load", error.message);
    return set({ status: "offline", email: session.user.email });
  }
  const local = currentData();
  const owner = ls.get(OWNER);
  const dirty = ls.get(DIRTY) === "1";
  if (!row) {
    // New account: this device's data becomes the account's, unless it belongs to someone else.
    if (owner && owner !== uid) replaceData(normalise(null));
    ls.set(OWNER, uid);
    set({ status: "saving", email: session.user.email });
    return push();
  }
  const remote = normalise(row.data as Partial<Data>);
  if (owner === uid) {
    if (dirty) return push(); // changes made here while away win
    replaceData(remote);
  } else if (!owner && !isEmpty(local)) {
    replaceData(merge(local, remote));
    ls.set(OWNER, uid);
    return push();
  } else {
    replaceData(remote);
  }
  ls.set(OWNER, uid);
  set({ status: "saved", email: session.user.email });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const s = supabase();
  if (!s) return set({ status: "off" });

  onUserWrite(() => {
    if (!session) return;
    ls.set(DIRTY, "1");
    schedule();
  });

  s.auth.onAuthStateChange((event, next) => {
    const was = session?.user.id;
    session = next;
    if (!next) {
      if (event === "SIGNED_OUT" && was) {
        // Leave nothing behind for the next person on this device.
        replaceData(normalise(null));
        ls.set(OWNER, null);
        ls.set(DIRTY, null);
      }
      return set({ status: "signed-out" });
    }
    if (next.user.id !== was) setTimeout(pull, 0); // outside the auth callback, per Supabase's guidance
  });

  // Another device may have changed things while this tab was in the background.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && session && ls.get(DIRTY) !== "1") pull();
  });
  window.addEventListener("online", () => {
    if (session && ls.get(DIRTY) === "1") push();
  });
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => void listeners.delete(l);
}

const serverState: SyncState = { status: "loading" };

export function useSync(): SyncState {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

export async function sendCode(email: string) {
  const s = supabase();
  if (!s) throw new Error("off");
  const { error } = await s.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/account` } });
  if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
  const s = supabase();
  if (!s) throw new Error("off");
  const { error } = await s.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function signOut() {
  clearTimeout(timer);
  if (ls.get(DIRTY) === "1") await push();
  await supabase()?.auth.signOut();
}
