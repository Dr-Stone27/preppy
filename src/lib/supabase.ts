import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Public project settings. Both are safe in the browser; row-level security does the protecting. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const accountsOn = Boolean(SUPABASE_URL && SUPABASE_KEY);

let client: SupabaseClient | null = null;

/** Browser client. Null when the project isn't configured, so the app keeps working on this device alone. */
export function supabase(): SupabaseClient | null {
  if (!accountsOn || typeof window === "undefined") return null;
  return (client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "preppy:auth" },
  }));
}

/** Bearer header for our own API routes, so the server can count AI use per account. */
export async function authHeader(): Promise<Record<string, string>> {
  const s = supabase();
  if (!s) return {};
  const { data } = await s.auth.getSession();
  return data.session ? { authorization: `Bearer ${data.session.access_token}` } : {};
}
