import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase";

/** The server's Supabase secret key. Never sent to the browser. */
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const hasSecret = () => !!SECRET;

/** New-style secret keys go in `apikey` only; legacy service-role keys also go in Authorization. */
export const secretHeaders = (): Record<string, string> =>
  SECRET.startsWith("sb_secret_") ? { apikey: SECRET } : { apikey: SECRET, authorization: `Bearer ${SECRET}` };

/** The signed-in account behind a "Bearer …" header, checked with Supabase Auth. */
export async function accountFrom(auth: string | null, signal?: AbortSignal): Promise<{ id: string } | "sign-in" | "error"> {
  if (!auth?.startsWith("Bearer ")) return "sign-in";
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, authorization: auth }, signal });
  if (who.status === 401 || who.status === 403) return "sign-in";
  if (!who.ok) return "error";
  const { id } = (await who.json()) as { id?: string };
  return id ? { id } : "sign-in";
}

/** Requests from other sites are refused; the app only calls its own endpoints. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  return !origin || !host || new URL(origin).host === host;
}
